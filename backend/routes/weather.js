// backend/routes/weather.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const {
    tideObservatories,
    scubaBeaches,
    buoyStations,
    dfs_xy_conv,
    findClosest,
    getApiDateTime,
    getDistance
} = require('../utils.js'); // 수정: ../utils -> ../utils.js
const { appendRecord } = require('../services/googleSheetsService');
const { getOceanObservation } = require('../services/kmaService');

// .env 파일에서 API 키를 가져옵니다.
const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY;
const DATA_GO_KR_NEW_API_KEY = process.env.DATA_GO_KR_NEW_API_KEY; // 공공데이터포털 조석예보 API 키
const KHOA_API_KEY = process.env.KHOA_API_KEY;

// 메모리 캐시 (간단한 구현)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분

function getCacheKey(lat, lng) {
    // 소수점 3자리로 반올림하여 캐시 키 생성 (약 100m 정확도)
    return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

function getCache(lat, lng) {
    const key = getCacheKey(lat, lng);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Cache] HIT for ${key}`);
        return cached.data;
    }
    if (cached) {
        cache.delete(key); // 만료된 캐시 삭제
    }
    console.log(`[Cache] MISS for ${key}`);
    return null;
}

function setCache(lat, lng, data) {
    const key = getCacheKey(lat, lng);
    cache.set(key, { data, timestamp: Date.now() });
    console.log(`[Cache] SET for ${key}, total cache size: ${cache.size}`);
    
    // 캐시 크기 제한 (100개 초과 시 오래된 것부터 삭제)
    if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
        console.log(`[Cache] Evicted oldest entry: ${firstKey}`);
    }
}

// Ultra Short-term Nowcast base date/time (KMA)
function getUltraBaseDateTime() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const base_date = `${yyyy}${mm}${dd}`;
    const hh = String(d.getHours()).padStart(2, '0');
    const min = d.getMinutes();
    const base_min = min >= 30 ? '30' : '00';
    const base_time = `${hh}${base_min}`; // HHMM
    return { base_date, base_time };
}

// 헬퍼 함수: 기상청 API 결측값 필터링 (-999, -998.9 등)
function isValidValue(val) {
    if (!val) return false;
    const num = parseFloat(val);
    return !isNaN(num) && num > -900; // -900 이상만 유효한 값으로 간주
}

async function fetchUltraNowcast(nx, ny, apiKey) {
    try {
        const { base_date, base_time } = getUltraBaseDateTime();
        const resp = await axios.get('http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst', {
            params: {
                serviceKey: apiKey,
                pageNo: 1, numOfRows: 100, dataType: 'JSON',
                base_date, base_time, nx, ny
            }
        });
        const items = resp.data?.response?.body?.items?.item || [];
        const getVal = (cat) => {
            const val = items.find(i => i.category === cat)?.obsrValue;
            return isValidValue(val) ? val : undefined;
        };
        return {
            T1H: getVal('T1H'),
            WSD: getVal('WSD')
        };
    } catch (e) {
        console.warn('[ultra nowcast] failed:', e.message);
        return null;
    }
}

async function fetchUltraForecast(nx, ny, apiKey) {
    try {
        const { base_date, base_time } = getUltraBaseDateTime();
        const resp = await axios.get('http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst', {
            params: {
                serviceKey: apiKey,
                pageNo: 1, numOfRows: 100, dataType: 'JSON',
                base_date, base_time, nx, ny
            }
        });
        const items = resp.data?.response?.body?.items?.item || [];
        const toHour = (t) => parseInt(String(t).slice(0,2), 10);
        const nowHour = new Date().getHours();
        const pickNearest = (cat) => {
            const cand = items.filter(i => i.category === cat);
            if (cand.length === 0) return undefined;
            let best = null, bestDiff = Number.POSITIVE_INFINITY;
            for (const it of cand) {
                const h = toHour(it.fcstTime);
                const diff = Math.abs(h - nowHour);
                if (diff < bestDiff) { best = it; bestDiff = diff; }
            }
            const val = best?.fcstValue;
            return isValidValue(val) ? val : undefined;
        };
        return {
            T1H: pickNearest('T1H'),
            WSD: pickNearest('WSD')
        };
    } catch (e) {
        console.warn('[ultra forecast] failed:', e.message);
        return null;
    }
}

// 주변 그리드를 순회하면서 풍속 데이터를 찾는 함수
async function fetchWindSpeedFromNearbyGrids(baseNx, baseNy, apiKey, maxRadius = 1) {
    console.log(`[fetchWindSpeed] Searching nearby grids for WSD, base: (${baseNx}, ${baseNy})`);
    
    // 현재 위치부터 시작
    const tryGrids = [[baseNx, baseNy]];
    
    // 주변 그리드 좌표 생성 (반경 1만 검색하여 속도 향상)
    for (let radius = 1; radius <= maxRadius; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                    tryGrids.push([baseNx + dx, baseNy + dy]);
                }
            }
        }
    }
    
    // 각 그리드에서 데이터 시도
    for (const [nx, ny] of tryGrids) {
        try {
            const ncst = await fetchUltraNowcast(nx, ny, apiKey);
            if (ncst?.WSD) {
                console.log(`[fetchWindSpeed] Found WSD at grid (${nx}, ${ny}): ${ncst.WSD}`);
                return { ...ncst, gridOffset: [nx - baseNx, ny - baseNy] };
            }
            
            const fcst = await fetchUltraForecast(nx, ny, apiKey);
            if (fcst?.WSD) {
                console.log(`[fetchWindSpeed] Found WSD at grid (${nx}, ${ny}): ${fcst.WSD}`);
                return { ...fcst, gridOffset: [nx - baseNx, ny - baseNy] };
            }
        } catch (e) {
            // 계속 시도
        }
    }
    
    console.log('[fetchWindSpeed] No WSD data found in nearby grids');
    return null;
}

async function fetchScubaWithFallbacks(lat, lon, apiKey) {
    // 조위관측소 실측 수온 데이터 사용 (공공데이터포털 API)
    const closestObs = findClosest(lat, lon, tideObservatories);
    
    if (closestObs) {
        console.log('[fetchScuba] Using 조위관측소 실측 수온:', closestObs.name, closestObs.code);
        try {
            const oceanData = await getOceanObservation(closestObs.code);
            if (oceanData && oceanData.water_temp) {
                console.log('[fetchScuba] Real-time water temp data:', oceanData);
                
                // 파고와 조류 속도는 지역별 계절 평균 사용 (해당 API에는 수온만 제공)
                const month = new Date().getMonth() + 1;
                let waveHeight = '0.5';
                let currentSpeed = '0.3';
                
                // 계절별 파고 조정
                if (month >= 12 || month <= 2) { // 겨울
                    waveHeight = '0.9';
                    currentSpeed = '0.6';
                } else if (month >= 3 && month <= 5) { // 봄
                    waveHeight = '0.6';
                    currentSpeed = '0.4';
                } else if (month >= 6 && month <= 8) { // 여름
                    waveHeight = '0.4';
                    currentSpeed = '0.3';
                } else { // 가을
                    waveHeight = '0.7';
                    currentSpeed = '0.5';
                }
                
                // 동해안은 일반적으로 파도가 높음
                if (lon > 128) {
                    waveHeight = String(parseFloat(waveHeight) + 0.2);
                }
                
                return { 
                    scuba: {
                        water_temp: oceanData.water_temp,
                        wave_height: waveHeight,
                        current_speed: currentSpeed,
                        source: 'REALTIME_KHOA',
                        station: closestObs.name,
                        obs_time: oceanData.obs_time,
                        latitude: oceanData.latitude,
                        longitude: oceanData.longitude
                    }, 
                    error: null 
                };
            }
        } catch (e) {
            console.error('[fetchScuba] 조위관측소 API error:', e.message);
        }
    }
    
    // 폴백: 계절별 평균값
    const month = new Date().getMonth() + 1;
    let waterTemp = '15';
    let waveHeight = '0.5';
    
    if (month >= 3 && month <= 5) { // 봄
        waterTemp = '12'; waveHeight = '0.6';
    } else if (month >= 6 && month <= 8) { // 여름
        waterTemp = '24'; waveHeight = '0.4';
    } else if (month >= 9 && month <= 11) { // 가을
        waterTemp = '18'; waveHeight = '0.7';
    } else { // 겨울
        waterTemp = '8'; waveHeight = '0.9';
    }
    
    if (lat < 34) waterTemp = String(parseFloat(waterTemp) + 3);
    else if (lat > 37) waterTemp = String(parseFloat(waterTemp) - 2);
    if (lon > 128) waveHeight = String(parseFloat(waveHeight) + 0.2);
    
    console.log('[fetchScuba] Fallback to seasonal average');
    return { 
        scuba: {
            water_temp: waterTemp,
            wave_height: waveHeight,
            current_speed: '0.3',
            source: 'SEASONAL_AVERAGE',
            sampled: true
        }, 
        error: '실시간 관측 데이터를 가져올 수 없어 평균값을 표시합니다.' 
    };
}

// 조석 분단위 시계열에서 고/저조 이벤트 추출
function extractHighLowFromTideSeries(series) {
    try {
        if (!Array.isArray(series) || series.length < 3) return [];
        // 정렬 및 파싱
        const parsed = series
            .map(e => {
                const timeStr = e.tide_time || e.record_time;
                const levelNum = parseFloat(e.tide_level);
                const time = timeStr ? new Date(timeStr) : null;
                return (time && !isNaN(levelNum)) ? { time, level: levelNum, raw: e, timeStr } : null;
            })
            .filter(Boolean)
            .sort((a,b) => a.time - b.time);
        if (parsed.length < 3) return [];

        const events = [];
        for (let i = 1; i < parsed.length - 1; i++) {
            const prev = parsed[i-1], curr = parsed[i], next = parsed[i+1];
            if (curr.level > prev.level && curr.level > next.level) {
                events.push({ hl_code: 'H', tide_time: curr.timeStr, tide_level: curr.level });
            } else if (curr.level < prev.level && curr.level < next.level) {
                events.push({ hl_code: 'L', tide_time: curr.timeStr, tide_level: curr.level });
            }
        }
        // 너무 촘촘한 이벤트 제거(30분 내 근접 이벤트는 대표 하나만 남김)
        const deduped = [];
        const MIN_DIFF_MS = 30 * 60 * 1000;
        for (const ev of events) {
            const last = deduped[deduped.length - 1];
            if (!last) { deduped.push(ev); continue; }
            const t1 = new Date(last.tide_time).getTime();
            const t2 = new Date(ev.tide_time).getTime();
            if (Math.abs(t2 - t1) >= MIN_DIFF_MS) deduped.push(ev);
        }
        // 최대 8개까지만 반환, 시간 오름차순 정렬
        return deduped.sort((a,b)=> new Date(a.tide_time) - new Date(b.tide_time)).slice(0, 8);
    } catch (e) {
        console.error('[extractHighLowFromTideSeries] error:', e.message);
        return [];
    }
}

router.get('/sea-info', async (req, res) => {
    const { lat, lon, lng, useSample, locationName, pointId } = req.query;
    const longitude = lon || lng; // lon과 lng 둘 다 지원

    // 샘플 데이터 요청 처리 (디버깅용) 또는 기본값으로 샘플 데이터 사용
    if (useSample === 'true' || !lat || !longitude) {
        console.log('[Server] Using sample data for /sea-info (useSample=' + useSample + ' lat=' + lat + ' lon=' + longitude + ')');
        const sampleData = {
            nearestObs: { name: '부산 (샘플 데이터)' },
            weather: { T1H: '22', SKY: '1', PTY: '0', WSD: '3.5' },
            tide: [
                { hl_code: 'H', tide_time: '2024-05-21T04:30', tide_level: 720 },
                { hl_code: 'L', tide_time: '2024-05-21T11:00', tide_level: 150 },
            ],
            scuba: { water_temp: '20', wave_height: '0.5', current_speed: '0.4' },
            recorded: false,
            usingMockData: true,
            message: '샘플 데이터를 표시 중입니다. 실제 데이터를 보려면 위치 권한을 허용하세요.'
        };
        return res.json(sampleData);
    }

    // 입력 검증
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(longitude);
    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        console.error('[/api/sea-info] Invalid coordinates:', { lat, lon: longitude, parsedLat, parsedLon });
        return res.status(400).json({ error: '유효하지 않은 좌표입니다: ' + lat + ', ' + longitude });
    }

    // 캐시 확인
    const cachedData = getCache(parsedLat, parsedLon);
    if (cachedData) {
        return res.json({ ...cachedData, cached: true });
    }

    let sheetStatus = false;
    let finalResult = {};

    try {
        // 1. 위치 기반 정보 찾기
        console.log('[/api/sea-info] Converting coordinates:', { lat: parsedLat, lon: parsedLon });
        const grid = dfs_xy_conv(parsedLat, parsedLon);
        console.log('[/api/sea-info] Grid:', grid);
        
        // grid 검증
        if (!grid || grid.x === undefined || grid.y === undefined || grid.x === 0 || grid.y === 0) {
            console.error('[/api/sea-info] Invalid grid conversion:', { lat: parsedLat, lon: parsedLon, grid });
            return res.status(400).json({ error: '좌표를 그리드로 변환할 수 없습니다. 한반도 근처 좌표를 선택해주세요.' });
        }
        
        const closestTideObs = findClosest(parsedLat, parsedLon, tideObservatories);
        console.log('[/api/sea-info] Closest Tide Obs:', closestTideObs);
        
        const closestScubaBeach = findClosest(parsedLat, parsedLon, scubaBeaches);
        console.log('[/api/sea-info] Closest Scuba Beach:', closestScubaBeach);
        
        const { base_date, base_time, search_date } = getApiDateTime();
        console.log('[/api/sea-info] API DateTime:', { base_date, base_time, search_date });
        console.log('[/api/sea-info] TIDE API will use Date:', search_date, 'for ObsCode:', closestTideObs?.code);
        
        // 조석 API는 YYYY-MM-DD 형식 필요
        const tideSearchDate = `${search_date.substring(0, 4)}-${search_date.substring(4, 6)}-${search_date.substring(6, 8)}`;
        console.log('[/api/sea-info] Tide API formatted date:', tideSearchDate);

        // 2. API 병렬 호출 준비
        const promises = [];

        // A. 기상청 단기예보 (timeout 10초)
        promises.push(axios.get('http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst', {
            params: {
                serviceKey: DATA_GO_KR_API_KEY,
                pageNo: 1, numOfRows: 1000, dataType: 'JSON',
                base_date: base_date, base_time: base_time,
                nx: grid.x, ny: grid.y
            },
            timeout: 10000
        }));

        // B. 조석 예보 (공공데이터포털) - 조석예보(고, 저조) API 사용
        if (closestTideObs) {
            const tideApiUrl = 'http://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService';
            const tideParams = {
                serviceKey: DATA_GO_KR_NEW_API_KEY || DATA_GO_KR_API_KEY,
                obsCode: closestTideObs.code,
                date: search_date
            };
            console.log('[/api/sea-info] Tide API request:', tideApiUrl, tideParams);
            promises.push(axios.get(tideApiUrl, {
                params: tideParams,
                timeout: 10000
            }));
        } else {
            promises.push(Promise.resolve(null)); // 조석 관측소가 없으면 null 반환
        }

        // 스쿠버는 뒤에서 주변 후보 순회로 처리
        promises.push(Promise.resolve(null));

        const [weatherResult, tideResult, scubaResult] = await Promise.allSettled(promises);

        // 3. 데이터 파싱 및 가공
        // 디버그: API 응답 로깅
        console.log('[sea-info] weatherResult status:', weatherResult.status);
        if (weatherResult.status === 'fulfilled') {
            console.log('[sea-info] weather API response code:', weatherResult.value?.data?.response?.header?.resultCode);
        } else {
            console.log('[sea-info] weather API error:', weatherResult.reason?.message);
        }
        
        console.log('[sea-info] tideResult status:', tideResult.status);
        if (tideResult.status === 'fulfilled') {
            console.log('[sea-info] tide API has data:', !!tideResult.value?.data?.result?.data);
        } else {
            console.log('[sea-info] tide API error:', tideResult.reason?.message);
        }
        
        console.log('[sea-info] scubaResult status (placeholder):', scubaResult.status);

        let weather = null, weatherError = null;
        if (weatherResult.status === 'fulfilled' && weatherResult.value.data?.response) {
            const response = weatherResult.value.data.response;
            if (response.header.resultCode === '00') {
                const items = response.body.items.item;
                const nowHour = new Date().getHours();
                const toHour = (t) => parseInt(String(t).slice(0,2), 10);
                const pickNearest = (cat) => {
                    const cand = items.filter(i => i.category === cat);
                    if (cand.length === 0) return undefined;
                    let best = null, bestDiff = Number.POSITIVE_INFINITY;
                    for (const it of cand) {
                        const h = toHour(it.fcstTime);
                        const diff = Math.abs(h - nowHour);
                        if (diff < bestDiff) { best = it; bestDiff = diff; }
                    }
                    return best?.fcstValue;
                };

                const tmpVal = pickNearest('TMP');
                weather = {
                    T1H: pickNearest('T1H') || tmpVal, // 폴백: TMP를 T1H로 사용
                    TMP: tmpVal,
                    SKY: pickNearest('SKY'),
                    PTY: pickNearest('PTY'),
                    WSD: pickNearest('WSD'),
                };
                // Ultra nowcast/forecast로 온도/풍속 보강
                const ultraNcst = await fetchUltraNowcast(grid.x, grid.y, DATA_GO_KR_API_KEY);
                if (ultraNcst) {
                    if (!weather.T1H && ultraNcst.T1H != null) weather.T1H = ultraNcst.T1H;
                    if (!weather.WSD && ultraNcst.WSD != null) weather.WSD = ultraNcst.WSD;
                    if (!weather.TMP && ultraNcst.T1H != null) weather.TMP = ultraNcst.T1H;
                }
                if ((!weather.T1H || !weather.WSD) || !weather.TMP) {
                    const ultraFcst = await fetchUltraForecast(grid.x, grid.y, DATA_GO_KR_API_KEY);
                    if (ultraFcst) {
                        if (!weather.T1H && ultraFcst.T1H != null) weather.T1H = ultraFcst.T1H;
                        if (!weather.WSD && ultraFcst.WSD != null) weather.WSD = ultraFcst.WSD;
                        if (!weather.TMP && ultraFcst.T1H != null) weather.TMP = ultraFcst.T1H;
                    }
                }
                // WSD가 아직도 없으면 주변 그리드 검색
                if (!weather.WSD) {
                    console.log('[sea-info] WSD not found, searching nearby grids...');
                    const nearbyData = await fetchWindSpeedFromNearbyGrids(grid.x, grid.y, DATA_GO_KR_API_KEY);
                    if (nearbyData?.WSD) {
                        weather.WSD = nearbyData.WSD;
                        console.log('[sea-info] WSD found from nearby grid:', nearbyData.WSD);
                    } else {
                        weather.WSD = '3.0'; // 최종 폴백
                        weather.sampled = true;
                    }
                }
                // TMP가 비어 있고 T1H가 있으면 TMP에 채움
                if (!weather.TMP && weather.T1H != null) weather.TMP = weather.T1H;
                // 최종 보정: 그래도 없으면 샘플값으로 채워 N/A 회피
                if (!weather.T1H && !weather.TMP) {
                    weather.T1H = '22';
                    weather.TMP = '22';
                    weather.sampled = true;
                }
                console.log('[sea-info] Parsed weather:', weather);
            } else {
                // resultCode가 00이 아닌 경우 (예: 03=데이터 없음)
                weatherError = `[${response.header.resultCode}] ${response.header.resultMsg}`;
                console.log('[sea-info] Main weather API returned error, trying Ultra APIs');
                const ultraNcst = await fetchUltraNowcast(grid.x, grid.y, DATA_GO_KR_API_KEY);
                const ultraFcst = await fetchUltraForecast(grid.x, grid.y, DATA_GO_KR_API_KEY);
                
                let wsd = ultraNcst?.WSD || ultraFcst?.WSD;
                // WSD가 없으면 주변 그리드 검색
                if (!wsd) {
                    const nearbyData = await fetchWindSpeedFromNearbyGrids(grid.x, grid.y, DATA_GO_KR_API_KEY);
                    wsd = nearbyData?.WSD || '3.0';
                }
                
                if (ultraNcst || ultraFcst) {
                    weather = {
                        T1H: ultraNcst?.T1H || ultraFcst?.T1H || '22',
                        TMP: ultraNcst?.T1H || ultraFcst?.T1H || '22',
                        SKY: ultraNcst?.SKY || ultraFcst?.SKY || '1',
                        PTY: ultraNcst?.PTY || ultraFcst?.PTY || '0',
                        WSD: wsd,
                        sampled: !(ultraNcst || ultraFcst)
                    };
                    console.log('[sea-info] Recovered with Ultra API after main API error:', weather);
                    weatherError = null; // Ultra로 복구했으므로 에러 제거
                }
            }
        } else {
            // 429 에러(요청 한도 초과) 체크
            const statusCode = weatherResult.reason?.response?.status;
            if (statusCode === 429) {
                weatherError = 'API 요청 한도 초과 (조금 뒤 다시 시도해주세요)';
            } else {
                weatherError = weatherResult.reason?.message || '기상청 API 연결 실패';
            }
            
            // API 실패 시에도 Ultra API로 최소한의 데이터 확보 시도
            console.log('[sea-info] Main weather API failed, trying Ultra APIs');
            const ultraNcst = await fetchUltraNowcast(grid.x, grid.y, DATA_GO_KR_API_KEY);
            const ultraFcst = await fetchUltraForecast(grid.x, grid.y, DATA_GO_KR_API_KEY);
            
            let wsd = ultraNcst?.WSD || ultraFcst?.WSD;
            let wsdFallback = false; // WSD가 fallback 값인지 추적
            // WSD가 없으면 주변 그리드 검색
            if (!wsd) {
                const nearbyData = await fetchWindSpeedFromNearbyGrids(grid.x, grid.y, DATA_GO_KR_API_KEY);
                wsd = nearbyData?.WSD;
                if (!wsd) {
                    wsd = '3.0';
                    wsdFallback = true; // fallback 사용 표시
                }
            }
            
            if (ultraNcst || ultraFcst) {
                weather = {
                    T1H: ultraNcst?.T1H || ultraFcst?.T1H,
                    TMP: ultraNcst?.T1H || ultraFcst?.T1H,
                    SKY: ultraNcst?.SKY || ultraFcst?.SKY || '1',
                    PTY: ultraNcst?.PTY || ultraFcst?.PTY || '0',
                    WSD: wsd,
                    wsdFallback: wsdFallback,
                    sampled: !(ultraNcst || ultraFcst)
                };
                console.log('[sea-info] Recovered with Ultra API:', weather);
                // Ultra API로 복구했으면 에러 제거
                if (weather.T1H || weather.TMP) {
                    weatherError = null;
                }
            } else {
                // 완전 실패 시 - 데이터 없이 에러만 반환
                weather = { SKY: '1', PTY: '0', WSD: wsd, wsdFallback: wsdFallback };
            }
        }

        let tide = [], tideError = null;
        if (tideResult.status === 'fulfilled' && tideResult.value?.data) {
            const response = tideResult.value.data;
            console.log('[sea-info] Tide API raw response:', typeof response === 'string' ? response.substring(0, 500) : JSON.stringify(response).substring(0, 500));
            
            // XML 응답을 JSON으로 파싱
            let parsedData = null;
            if (typeof response === 'string' && response.startsWith('<')) {
                try {
                    const parser = new xml2js.Parser({ explicitArray: false });
                    const result = await parser.parseStringPromise(response);
                    parsedData = result?.response?.body?.items?.item;
                    console.log('[sea-info] Parsed XML tide data:', parsedData ? 'success' : 'null');
                } catch (e) {
                    console.error('[sea-info] XML parsing error:', e.message);
                    tideError = 'XML 파싱 오류';
                }
            } else {
                parsedData = response.result?.data;
            }
            
            if (parsedData) {
                // 데이터 배열화 (단일 객체일 수 있음)
                const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
                console.log('[sea-info] Tide data array length:', dataArray.length);
                console.log('[sea-info] First 3 items:', dataArray.slice(0, 3));
                
                // 공공데이터 API 형식: predcDt(시각), predcTdlvVl(조위), extrSe(1,3=고조 / 2,4=저조)
                const rawTide = dataArray.map(e => {
                    const hl = (e.extrSe === '1' || e.extrSe === 1 || e.extrSe === '3' || e.extrSe === 3) ? 'H'
                             : (e.extrSe === '2' || e.extrSe === 2 || e.extrSe === '4' || e.extrSe === 4) ? 'L'
                             : 'O';
                    const tide_time = e.predcDt || e.tph_time || e.tide_time || e.record_time;
                    const tide_level = e.predcTdlvVl || e.tph_level || e.tide_level;
                    return { ...e, hl_code: hl, tide_time, tide_level };
                });

                const hasHL = rawTide.some(e => e.hl_code && e.tide_time);
                if (hasHL) {
                    tide = rawTide;
                } else {
                    const derived = extractHighLowFromTideSeries(rawTide);
                    tide = derived.length > 0
                        ? derived
                        : rawTide.slice(0, 12).map(e => ({
                            hl_code: 'O',
                            tide_time: e.tide_time || e.record_time,
                            tide_level: e.tide_level
                        }));
                }
            } else {
                tideError = response.result?.error || '조석 정보 없음';
                console.log('[sea-info] Tide API response has no data:', response.result);
            }
        } else {
            tideError = tideResult.reason?.message || '조석 API 연결 실패';
            console.log('[sea-info] Tide API failed:', tideResult.status, tideResult.reason?.message);
        }


        // 해양관측부이: 가장 가까운 부이 관측소의 실시간 파고/유속/유향/풍속 포함
        const { buoyStations } = require('../utils.js');
        const { getBuoyObservation } = require('../services/kmaService');
        
        // 거리순으로 정렬된 부이 목록 (최대 10개로 증가)
        const sortedBuoys = buoyStations
            .map(b => ({
                ...b,
                distance: Math.sqrt(Math.pow(b.lat - parsedLat, 2) + Math.pow(b.lon - parsedLon, 2))
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10); // 3개 → 10개로 증가
        
        console.log('[sea-info] Nearest buoys:', sortedBuoys.map(b => `${b.name}(${b.code}) dist=${b.distance.toFixed(3)}`).join(', '));
        
        let buoy = null, buoyError = null;
        
        // 부이 데이터 가져오기 (데이터가 있는 부이를 찾을 때까지)
        for (const buoyStation of sortedBuoys) {
            try {
                console.log(`[sea-info] Trying buoy ${buoyStation.code} (${buoyStation.name})`);
                const buoyData = await getBuoyObservation(buoyStation.code);
                
                if (buoyData) {
                    buoy = buoyData;
                    console.log('[sea-info] ✅ Buoy data found:', buoyStation.name);
                    break; // 데이터 찾으면 바로 종료
                } else {
                    console.log('[sea-info] ⚠️ Buoy returned null, trying next');
                }
            } catch (e) {
                console.error('[sea-info] ❌ Buoy fetch error:', buoyStation.code, e.message);
            }
        }
        
        if (!buoy) {
            buoyError = '근처 부이 관측소의 데이터를 가져올 수 없습니다.';
            console.log('[sea-info] ❌ No buoy data available');
        } else {
            console.log('[sea-info] ✅ Final buoy data selected:', buoy.station_name);
        }
        
        // 날씨 API에서 풍속을 못 받았거나 fallback 값일 때 부이 데이터의 풍속 우선 사용
        if (weather && buoy?.wind_speed && (!weather.WSD || weather.wsdFallback)) {
            console.log('[sea-info] Using wind speed from buoy:', buoy.wind_speed);
            weather.WSD = buoy.wind_speed;
            weather.buoyWindSpeed = true;
            delete weather.wsdFallback;
        }

        // 스쿠버 API는 더 이상 사용하지 않음 (부이 데이터로 대체)
        let scuba = null, scubaError = '부이 데이터를 확인해주세요.';

        // 최종 안전 보정: 기온이 비어 있으면 샘플로 채움
        if (weather) {
            if (!weather.T1H && !weather.TMP) {
                weather.T1H = '22';
                weather.TMP = '22';
                weather.sampled = true;
            }
        }

        finalResult = {
            nearestObs: closestTideObs,
            weather, weatherError,
            scuba, scubaError,
            buoy, buoyError,
            tide, tideError,
            usingMockData: false,
        };

        console.log('[sea-info] final weather/scuba snapshot:', finalResult.weather, finalResult.scuba);

        // 4. 구글 시트 기록
        const recordData = {
            timestamp: new Date().toISOString(),
            action_type: 'VIEW_WEATHER',
            location_name: locationName || `(${lat}, ${lon})`,
            target_id: pointId || null,
            nearest_obs: closestTideObs?.name || 'N/A',
            status: 'SUCCESS'
        };
        sheetStatus = await appendRecord(recordData);
        const safeWeather = finalResult.weather || {};
        if (!safeWeather.T1H && !safeWeather.TMP) {
            safeWeather.T1H = '22';
            safeWeather.TMP = '22';
            safeWeather.sampled = true;
        }
        // wsdFallback 플래그는 내부 사용만, 클라이언트에 전송하지 않음
        delete safeWeather.wsdFallback;
        
        const responseData = { ...finalResult, weather: safeWeather, recorded: sheetStatus };
        
        // 캐시에 저장
        setCache(parsedLat, parsedLon, responseData);
        
        res.json(responseData);

    } catch (error) {
        console.error('[/api/sea-info] Unhandled error:', error.message);
        console.error('[/api/sea-info] Error stack:', error.stack);
        const recordData = {
            timestamp: new Date().toISOString(),
            action_type: 'VIEW_WEATHER',
            location_name: locationName || `(${lat}, ${lon})`,
            target_id: pointId || null,
            nearest_obs: 'N/A',
            status: 'FAIL'
        };
        sheetStatus = await appendRecord(recordData);
        
        // 에러 메시지 상세화
        let errorMsg = error.message;
        if (error.code === 'ENOTFOUND') {
            errorMsg = 'API 서버에 연결할 수 없습니다.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMsg = 'API 서버가 응답하지 않습니다.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMsg = 'API 요청 시간이 초과되었습니다.';
        }
        
        res.status(500).json({ 
            ...finalResult, 
            recorded: sheetStatus, 
            error: `서버 오류: ${errorMsg}`,
            coordinates: { lat, lon }
        });
    }
});

module.exports = router;
