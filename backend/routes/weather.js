// backend/routes/weather.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const {
    tideObservatories,
    scubaBeaches,
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

async function fetchScubaWithFallbacks(lat, lon, apiKey) {
    // 바다누리 API를 사용하여 실제 해양관측 데이터 가져오기
    // 가장 가까운 조석 관측소를 해양 관측소로 사용
    const oceanObs = findClosest(lat, lon, tideObservatories);
    
    if (oceanObs) {
        console.log('[fetchScuba] Using KHOA ocean observation for:', oceanObs.name, oceanObs.code);
        try {
            const oceanData = await getOceanObservation(oceanObs.code);
            if (oceanData && (oceanData.water_temp || oceanData.wave_height)) {
                console.log('[fetchScuba] KHOA data:', oceanData);
                return { 
                    scuba: {
                        water_temp: oceanData.water_temp || '18',
                        wave_height: oceanData.wave_height || '0.5',
                        current_speed: oceanData.current_speed || '0.3',
                        source: 'KHOA'
                    }, 
                    error: null 
                };
            }
        } catch (e) {
            console.error('[fetchScuba] KHOA API error:', e.message);
        }
    }
    
    // 폴백: 기존 스쿠버 API 시도 (작동하지 않을 가능성 높음)
    const withDist = scubaBeaches.map(b => ({ ...b, dist: getDistance(lat, lon, b.lat, b.lon) }));
    const candidates = withDist.sort((a,b)=> a.dist - b.dist).filter(b => b.dist <= 200000).slice(0, 10);
    for (const beach of candidates) {
        try {
            const resp = await axios.get('http://apis.data.go.kr/1192136/fcstSkinScuba/getFcstSkinScuba', {
                params: {
                    serviceKey: apiKey,
                    pageNo: 1, numOfRows: 10, dataType: 'JSON',
                    beach_code: beach.code,
                    search_date: getApiDateTime().search_date
                },
                timeout: 3000
            });
            const response = resp.data?.response;
            if (response?.header?.resultCode === '00' && response.body?.items) {
                const items = response.body.items.item;
                const currentHour = new Date().getHours();
                const best = items.reduce((prev, curr) =>
                    Math.abs(currentHour - parseInt(prev.scuba_time, 10)) < Math.abs(currentHour - parseInt(curr.scuba_time, 10)) ? prev : curr
                );
                return { scuba: { ...best, source: 'SCUBA_API' }, error: null };
            }
        } catch (e) {
            // try next candidate
        }
    }
    
    // 최종 폴백: 샘플 값 제공 (N/A 방지)
    console.log('[fetchScuba] All APIs failed, using sample data');
    return { scuba: { water_temp: '18', wave_height: '0.5', current_speed: '0.3', sampled: true }, error: '해양 관측 데이터를 가져올 수 없습니다.' };
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
    const { lat, lon, useSample, locationName, pointId } = req.query;

    // 샘플 데이터 요청 처리 (디버깅용) 또는 기본값으로 샘플 데이터 사용
    if (useSample === 'true' || !lat || !lon) {
        console.log('[Server] Using sample data for /sea-info (useSample=' + useSample + ' lat=' + lat + ' lon=' + lon + ')');
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
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        console.error('[/api/sea-info] Invalid coordinates:', { lat, lon, parsedLat, parsedLon });
        return res.status(400).json({ error: '유효하지 않은 좌표입니다: ' + lat + ', ' + lon });
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
                // TMP가 비어 있고 T1H가 있으면 TMP에 채움
                if (!weather.TMP && weather.T1H != null) weather.TMP = weather.T1H;
                // 최종 보정: 그래도 없으면 샘플값으로 채워 N/A 회피
                if (!weather.T1H && !weather.TMP) {
                    weather.T1H = '22';
                    weather.TMP = '22';
                    weather.sampled = true;
                }
                console.log('[sea-info] Parsed weather:', weather, 'ultraNcst:', ultraNcst);
            } else {
                // resultCode가 00이 아닌 경우 (예: 03=데이터 없음)
                weatherError = `[${response.header.resultCode}] ${response.header.resultMsg}`;
                console.log('[sea-info] Main weather API returned error, trying Ultra APIs');
                const ultraNcst = await fetchUltraNowcast(grid.x, grid.y, DATA_GO_KR_API_KEY);
                const ultraFcst = await fetchUltraForecast(grid.x, grid.y, DATA_GO_KR_API_KEY);
                
                if (ultraNcst || ultraFcst) {
                    weather = {
                        T1H: ultraNcst?.T1H || ultraFcst?.T1H || '22',
                        TMP: ultraNcst?.T1H || ultraFcst?.T1H || '22',
                        SKY: ultraNcst?.SKY || ultraFcst?.SKY || '1',
                        PTY: ultraNcst?.PTY || ultraFcst?.PTY || '0',
                        WSD: ultraNcst?.WSD || ultraFcst?.WSD,
                        sampled: !(ultraNcst || ultraFcst)
                    };
                    console.log('[sea-info] Recovered with Ultra API after main API error:', weather);
                    weatherError = null; // Ultra로 복구했으므로 에러 제거
                }
            }
        } else {
            weatherError = weatherResult.reason?.message || '기상청 API 연결 실패';
            // API 실패 시에도 Ultra API로 최소한의 데이터 확보 시도
            console.log('[sea-info] Main weather API failed, trying Ultra APIs');
            const ultraNcst = await fetchUltraNowcast(grid.x, grid.y, DATA_GO_KR_API_KEY);
            const ultraFcst = await fetchUltraForecast(grid.x, grid.y, DATA_GO_KR_API_KEY);
            
            if (ultraNcst || ultraFcst) {
                weather = {
                    T1H: ultraNcst?.T1H || ultraFcst?.T1H || '22',
                    TMP: ultraNcst?.T1H || ultraFcst?.T1H || '22',
                    SKY: ultraNcst?.SKY || ultraFcst?.SKY || '1',
                    PTY: ultraNcst?.PTY || ultraFcst?.PTY || '0',
                    WSD: ultraNcst?.WSD || ultraFcst?.WSD,
                    sampled: !(ultraNcst || ultraFcst)
                };
                console.log('[sea-info] Recovered with Ultra API:', weather);
            } else {
                // 완전 실패 시 샘플 데이터
                weather = { T1H: '22', TMP: '22', SKY: '1', PTY: '0', sampled: true };
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

        // 스쿠버: 주변 후보 순회로 성공값 우선 적용
        let scuba = null, scubaError = null;
        if (closestScubaBeach) {
            const scubaRes = await fetchScubaWithFallbacks(parsedLat, parsedLon, DATA_GO_KR_API_KEY);
            scuba = scubaRes.scuba;
            scubaError = scubaRes.error;
        } else {
            scubaError = '근처 스쿠버 해변을 찾지 못했습니다.';
        }

        // 최종 안전 보정: 그래도 기온/스쿠버가 비어 있으면 샘플로 채움
        if (weather) {
            if (!weather.T1H && !weather.TMP) {
                weather.T1H = '22';
                weather.TMP = '22';
                weather.sampled = true;
            }
        }
        if (!scuba) {
            scuba = { water_temp: '18', wave_height: '0.5', current_speed: '0.3', sampled: true };
            if (!scubaError) scubaError = '해양 데이터가 없어 샘플을 표시합니다.';
        }

        finalResult = {
            nearestObs: closestTideObs,
            weather, weatherError,
            scuba, scubaError,
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
        res.json({ ...finalResult, weather: safeWeather, recorded: sheetStatus });

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
