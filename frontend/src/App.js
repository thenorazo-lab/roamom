// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import MapComponent from './components/MapComponent';
import PointsAdmin from './pages/PointsAdmin';
import JapanWaves from './pages/JapanWaves';
import AdSense from './components/AdSense';

// 오프라인(file://) 전용 샘플 데이터
const getSampleSeaInfo = () => ({
  nearestObs: { name: '샘플 관측소' },
  weather: { T1H: '20', TMP: '20', SKY: '1', PTY: '0', WSD: '3.2', sampled: true },
  scuba: { water_temp: '20', wave_height: '0.5', current_speed: '0.4', sampled: true },
  tide: [
    { hl_code: 'H', tide_time: '2025-01-01 07:02:00', tide_level: '420' },
    { hl_code: 'L', tide_time: '2025-01-01 13:20:00', tide_level: '40' },
    { hl_code: 'H', tide_time: '2025-01-01 19:35:00', tide_level: '450' },
    { hl_code: 'L', tide_time: '2025-01-02 00:43:00', tide_level: '16' },
  ],
  usingMockData: true,
  recorded: false,
});

// 가이드 페이지
const GuidePage = () => (
  <div className="container">
    <h2 className="page-title">📖 해루질 가이드</h2>
    <div style={{maxWidth: '800px', textAlign: 'left', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
      <h3>🌊 해루질이란?</h3>
      <p>해루질은 바닷가에서 조개, 소라, 성게 등 해산물을 채취하는 전통적인 활동입니다.</p>
      
      <h3>📍 안전한 해루질을 위한 팁</h3>
      <ul>
        <li>간조 시간을 확인하세요</li>
        <li>파고가 낮은 날을 선택하세요</li>
        <li>수온과 기상 상태를 체크하세요</li>
        <li>안전 장비를 착용하세요</li>
      </ul>
      
      <h3>🔍 이 앱 사용법</h3>
      <ul>
        <li><strong>바다날씨:</strong> 실시간 바다 기상 정보 확인</li>
        <li><strong>일본 파고:</strong> 일본 주변 파고 예보 확인</li>
        <li><strong>해루질 포인트:</strong> 추천 해루질 장소 탐색</li>
      </ul>
      
      <h3>🚶 워킹 해루질 가이드 모음</h3>
      <p>
        <a href="https://roafather.tistory.com/entry/%EC%9B%8C%ED%82%B9%ED%95%B4%EB%A3%A8%EC%A7%88-%EA%B0%80%EC%9D%B4%EB%93%9C" 
           target="_blank" 
           rel="noopener noreferrer" 
           style={{color:'#0077be', fontSize:'1.1rem', fontWeight:'600', textDecoration:'underline'}}>
          → 워킹 해루질 가이드 보러가기
        </a>
      </p>
      
      <h3>🤿 스킨 해루질 가이드 모음</h3>
      <p>
        <a href="https://roafather.tistory.com/entry/%EC%8A%A4%ED%82%A8-%ED%95%B4%EB%A3%A8%EC%A7%88-%EA%B0%80%EC%9D%B4%EB%93%9C" 
           target="_blank" 
           rel="noopener noreferrer" 
           style={{color:'#0077be', fontSize:'1.1rem', fontWeight:'600', textDecoration:'underline'}}>
          → 스킨 해루질 가이드 보러가기
        </a>
      </p>
    </div>
    <AdSense slot="2345678901" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />
    <div style={{marginTop: '24px'}}>
      <Link to="/" className="nav-button">🏠 홈으로</Link>
    </div>
  </div>
);

// 홈 화면
const HomePage = () => (
  <div className="container">
    <h1 className="main-title">해루질가자</h1>
    <p className="sub-title">바다날씨, 포인트, 일본 파고를 한 곳에서</p>
    <div className="nav-buttons">
      <Link to="/weather" className="nav-button">☁️ 바다날씨</Link>
      <Link to="/jp-wave" className="nav-button">🌊 일본 기상청 파고</Link>
      <Link to="/points" className="nav-button">📍 해루질 포인트</Link>
      <Link to="/guide" className="nav-button">📖 해루질 가이드</Link>
      <Link to="/points-admin" className="nav-button" style={{fontSize: '0.6rem', padding: '8px 12px', maxWidth: '180px', alignSelf: 'center'}}>⚙️ 포인트 관리자</Link>
    </div>
    <AdSense slot="1234567890" />
  </div>
);

// 바다날씨 페이지
const WeatherPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // file:// 로 열렸을 때는 API 호출 대신 샘플 데이터를 사용
    if (window.location.protocol === 'file:') {
      setData(getSampleSeaInfo());
      setLoading(false);
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || '';

    const fetchWithTimeout = async (url, opts = {}, timeoutMs = 8000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(id);
        return res;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    const fetchWeatherData = async (lat, lon, useSampleFallback = false) => {
      try {
        const params = new URLSearchParams();
        params.set('lat', lat);
        params.set('lon', lon);
        if (useSampleFallback) params.set('useSample', 'true');
        if (new URLSearchParams(window.location.search).get('sample') === 'true') params.set('useSample', 'true');
        params.set('_ts', Date.now()); // cache bust to avoid 304

        const url = `${apiUrl}/api/sea-info?${params.toString()}`;
        const response = await fetchWithTimeout(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }, 10000);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`서버 오류 (${response.status}): ${response.statusText}. ${errorText}`);
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    // 1) URL로 좌표가 넘어온 경우 우선 사용 (예: ?lat=35.1&lon=129.1&sample=true)
    const qs = new URLSearchParams(window.location.search);
    const qsLat = qs.get('lat');
    const qsLon = qs.get('lon');
    if (qsLat && qsLon) {
      const useSample = qs.get('sample') === 'true';
      fetchWeatherData(qsLat, qsLon, useSample);
      return;
    }

    // 2) 그렇지 않으면 브라우저 위치 권한 시도 (미지원/무응답 타임아웃 폴백)
    if (!('geolocation' in navigator)) {
      fetchWeatherData(35.1, 129.1, true);
      return;
    }

    const timeoutMs = 5000;
    const timerId = setTimeout(() => {
      // 위치 권한 무응답 등으로 지연될 때 샘플로 폴백
      fetchWeatherData(35.1, 129.1, true);
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timerId);
        const { latitude, longitude } = position.coords;
        await fetchWeatherData(latitude, longitude, false);
      },
      async () => {
        clearTimeout(timerId);
        // 권한 거부 등 실패 시 샘플로 표시
        await fetchWeatherData(35.1, 129.1, true);
      }
    );
  }, []);

  const getWeatherStatus = (sky, pty) => {
    if (pty && pty !== '0') {
      if (pty === '1') return '비';
      if (pty === '2') return '비/눈';
      if (pty === '3') return '눈';
      if (pty === '5') return '빗방울';
      if (pty === '6') return '빗방울/눈날림';
      if (pty === '7') return '눈날림';
    }
    if (sky) {
      if (sky === '1') return '맑음';
      if (sky === '3') return '구름많음';
      if (sky === '4') return '흐림';
    }
    return '정보 없음';
  };

  const formatTideTime = (t) => {
    if (!t) return '';
    try { return t.substring(11, 16); } catch { return t; }
  };

  const extractHighLowTides = (tideArr) => {
    if (!tideArr || !tideArr.length) return [];
    // 이미 H/L 태그가 있으면 그것만 필터링
    const hlOnly = tideArr.filter(t => t.hl_code === 'H' || t.hl_code === 'L');
    if (hlOnly.length > 0) return hlOnly;
    // 없으면 최고/최저값만 추출
    const levels = tideArr.map(t => parseInt(t.tide_level) || 0);
    const maxLevel = Math.max(...levels);
    const minLevel = Math.min(...levels);
    const result = [];
    const added = new Set();
    tideArr.forEach(t => {
      const level = parseInt(t.tide_level) || 0;
      const key = `${t.tide_time || t.record_time}-${level}`;
      if (!added.has(key)) {
        if (level === maxLevel) {
          result.push({ ...t, hl_code: 'H' });
          added.add(key);
        } else if (level === minLevel && !result.some(r => r.hl_code === 'L')) {
          result.push({ ...t, hl_code: 'L' });
          added.add(key);
        }
      }
    });
    return result.sort((a, b) => ((a.tide_time || a.record_time || '')).localeCompare((b.tide_time || b.record_time || '')));
  };

  const calculateTideChange = (tideArr, targetItem) => {
    if (!tideArr || tideArr.length < 2) return null;
    const targetTime = targetItem.tide_time || targetItem.record_time;
    const targetIdx = tideArr.findIndex(t => (t.tide_time || t.record_time) === targetTime);
    if (targetIdx <= 0) return null;
    
    const prevLevel = parseInt(tideArr[targetIdx - 1].tide_level) || 0;
    const currLevel = parseInt(targetItem.tide_level) || 0;
    const change = currLevel - prevLevel;
    return change;
  };

  const renderTideList = (tideArr) => {
    if (!tideArr || !tideArr.length) return null;
    const filtered = extractHighLowTides(tideArr);
    if (!filtered.length) return <p style={{color:'#666'}}>고조/저조 정보가 없습니다.</p>;
    
    const highTides = filtered.filter(t => t.hl_code === 'H');
    const lowTides = filtered.filter(t => t.hl_code === 'L');
    
    const renderTideItem = (item) => {
      const change = calculateTideChange(tideArr, item);
      const changeText = change !== null ? (change >= 0 ? `▲+${change}` : `▼${change}`) : '';
      return (
        <div key={`${item.tide_time || item.record_time}`} style={{marginBottom:'8px', fontSize:'14px'}}>
          <span style={{marginRight:'12px'}}>{formatTideTime(item.tide_time || item.record_time)}</span>
          <span style={{marginRight:'12px'}}>({item.tide_level})</span>
          <span style={{color:'#666'}}>{changeText}</span>
        </div>
      );
    };

    return (
      <div style={{fontSize:'14px'}}>
        {highTides.length > 0 && (
          <div style={{marginBottom:'16px'}}>
            <div style={{fontWeight:'bold', marginBottom:'8px', color:'#2196F3'}}>만조</div>
            {highTides.map(renderTideItem)}
          </div>
        )}
        {lowTides.length > 0 && (
          <div>
            <div style={{fontWeight:'bold', marginBottom:'8px', color:'#f44336'}}>간조</div>
            {lowTides.map(renderTideItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <h2 className="page-title">현재 위치 바다 날씨</h2>
      {loading && <p>데이터를 불러오는 중입니다...</p>}
      {error && <p className="error-message">오류: {error}</p>}
      {data && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3>위치: {data.nearestObs?.name || '현재 위치'}</h3>
            <div style={{fontSize:12, color:'#666'}}>기록 상태: {data.recorded ? '기록됨' : '기록 실패/비활성'}{data.usingMockData ? ' (샘플 데이터 사용 중)' : ''}</div>
          </div>

          <div className="info-cards">
            <div className="card">
              <h3>☀️ 날씨 {data.weatherError && <span style={{color:'#a33', fontSize:12, marginLeft:8}}>(데이터 일부 없음)</span>}</h3>
              <p>상태: {getWeatherStatus(data.weather?.SKY, data.weather?.PTY) ?? '정보 없음'}</p>
              <p>기온: {data.weather?.T1H ?? data.weather?.TMP ?? 'N/A'}°C</p>
              <p>풍속: {data.weather?.WSD ?? 'N/A'} m/s</p>
            </div>

            <div className="card">
              <h3>🌊 해양 정보</h3>
              <p>수온: {data.scuba?.water_temp ?? 'N/A'}°C</p>
              <p>파고: {data.scuba?.wave_height ?? 'N/A'} m</p>
              <p>유속: {data.scuba?.current_speed ?? 'N/A'} knots</p>
            </div>

            <div className="card">
              <h3>🌊 물때</h3>
              {data.tideError ? (
                <div style={{color:'#a33'}}>조석 데이터를 불러오지 못했습니다.</div>
              ) : data.tide && data.tide.length > 0 ? (
                renderTideList(data.tide)
              ) : <p>물때 정보가 없습니다.</p>}
            </div>
          </div>

          <p style={{fontSize: '12px', color: '#888', textAlign: 'center', margin: '16px 0'}}>출처: 오픈API 기상청_단기예보 / 해양수산부 국립해양조사원_스킨스쿠버지수 조회 / 해양수산부 국립해양조사원_조석예보</p>

          <AdSense slot="4567890123" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/map" className="nav-button" style={{ backgroundColor: '#2196F3', marginRight: '10px' }}>
              🗺️ 지도 보기
            </Link>
            <Link to="/" className="nav-button">🏠 홈으로</Link>
          </div>
        </div>
      )}
    </div>
  );
};

const PointsPage = () => {
  const [points, setPoints] = React.useState([]);

  React.useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || '';
    fetch(`${apiUrl}/api/points`)
      .then(r => r.json())
      .then(setPoints)
      .catch(() => setPoints([]));
  }, []);

  const handleMarkerClick = (marker) => {
    if (marker.url) {
      window.open(marker.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">📍 해루질 포인트</h2>
      <p>지도의 포인트를 눌러 정보를 확인하고 블로그 글을 읽어보세요.</p>
      <p style={{fontSize: '14px', color: '#666', marginTop: '8px'}}>공유하고 싶은 포인트를 thenorazo@gmail.com 로 제보해주세요!</p>
      <MapComponent center={[36.5, 127.5]} zoom={7} markers={points} onMapClick={() => {}} onMarkerClick={handleMarkerClick} />
      <AdSense slot="5678901234" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />
      <Link to="/" className="nav-button" style={{marginTop: '20px'}}>🏠 홈으로</Link>
    </div>
  );
};

const MapPage = () => {
  const [marker, setMarker] = React.useState(null);
  const [info, setInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // file:// 로 열렸을 때는 API 호출 대신 샘플 데이터를 사용
  React.useEffect(() => {
    if (window.location.protocol === 'file:') {
      setInfo(getSampleSeaInfo());
    }
  }, []);

  const getWeatherStatus = (sky, pty) => {
    if (pty && pty !== '0') {
      if (pty === '1') return '비';
      if (pty === '2') return '비/눈';
      if (pty === '3') return '눈';
      if (pty === '5') return '빗방울';
      if (pty === '6') return '빗방울/눈날림';
      if (pty === '7') return '눈날림';
    }
    if (sky) {
      if (sky === '1') return '맑음';
      if (sky === '3') return '구름많음';
      if (sky === '4') return '흐림';
    }
    return '정보 없음';
  };

  const formatTideTime = (t) => {
    if (!t) return '';
    try { return t.substring(11, 16); } catch { return t; }
  };

  const extractHighLowTides = (tideArr) => {
    if (!tideArr || !tideArr.length) return [];
    const hlOnly = tideArr.filter(t => t.hl_code === 'H' || t.hl_code === 'L');
    if (hlOnly.length > 0) return hlOnly;
    const levels = tideArr.map(t => parseInt(t.tide_level) || 0);
    const maxLevel = Math.max(...levels);
    const minLevel = Math.min(...levels);
    const result = [];
    const added = new Set();
    tideArr.forEach(t => {
      const level = parseInt(t.tide_level) || 0;
      const key = `${t.tide_time || t.record_time}-${level}`;
      if (!added.has(key)) {
        if (level === maxLevel) {
          result.push({ ...t, hl_code: 'H' });
          added.add(key);
        } else if (level === minLevel && !result.some(r => r.hl_code === 'L')) {
          result.push({ ...t, hl_code: 'L' });
          added.add(key);
        }
      }
    });
    return result.sort((a, b) => ((a.tide_time || a.record_time || '')).localeCompare((b.tide_time || b.record_time || '')));
  };

  const calculateTideChange = (tideArr, targetItem) => {
    if (!tideArr || tideArr.length < 2) return null;
    const targetTime = targetItem.tide_time || targetItem.record_time;
    const targetIdx = tideArr.findIndex(t => (t.tide_time || t.record_time) === targetTime);
    if (targetIdx <= 0) return null;
    
    const prevLevel = parseInt(tideArr[targetIdx - 1].tide_level) || 0;
    const currLevel = parseInt(targetItem.tide_level) || 0;
    const change = currLevel - prevLevel;
    return change;
  };

  const renderTideList = (tideArr) => {
    if (!tideArr || !tideArr.length) return null;
    const filtered = extractHighLowTides(tideArr);
    if (!filtered.length) return <p style={{color:'#666'}}>고조/저조 정보가 없습니다.</p>;
    
    const highTides = filtered.filter(t => t.hl_code === 'H');
    const lowTides = filtered.filter(t => t.hl_code === 'L');
    
    const renderTideItem = (item) => {
      const change = calculateTideChange(tideArr, item);
      const changeText = change !== null ? (change >= 0 ? `▲+${change}` : `▼${change}`) : '';
      return (
        <div key={`${item.tide_time || item.record_time}`} style={{marginBottom:'8px', fontSize:'14px'}}>
          <span style={{marginRight:'12px'}}>{formatTideTime(item.tide_time || item.record_time)}</span>
          <span style={{marginRight:'12px'}}>({item.tide_level})</span>
          <span style={{color:'#666'}}>{changeText}</span>
        </div>
      );
    };

    return (
      <div style={{fontSize:'14px'}}>
        {highTides.length > 0 && (
          <div style={{marginBottom:'16px'}}>
            <div style={{fontWeight:'bold', marginBottom:'8px', color:'#2196F3'}}>만조</div>
            {highTides.map(renderTideItem)}
          </div>
        )}
        {lowTides.length > 0 && (
          <div>
            <div style={{fontWeight:'bold', marginBottom:'8px', color:'#f44336'}}>간조</div>
            {lowTides.map(renderTideItem)}
          </div>
        )}
      </div>
    );
  };

  const handleMapClick = async (latlng) => {
    setMarker(latlng);
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const url = `${apiUrl}/api/sea-info?lat=${latlng.lat}&lon=${latlng.lng}&_ts=${Date.now()}`;
      console.log('[MapPage] Fetching:', url);
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' }, signal: controller.signal });
      clearTimeout(t);
      console.log('[MapPage] Response status:', res.status);
      
      if (!res.ok) {
        let errorText = '';
        try {
          const json = await res.json();
          errorText = json.error || res.statusText;
          console.error('[MapPage] Error response (JSON):', json);
        } catch (parseError) {
          errorText = await res.text();
          console.error('[MapPage] Error response (text):', errorText);
        }
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const json = await res.json();
      console.log('[MapPage] Data received:', json);
      console.log('[MapPage] Tide data specifically:', json.tide);
      console.log('[MapPage] Tide times:', json.tide?.map(t => t.tide_time || t.record_time));
      console.log('[MapPage] nearestObs:', json.nearestObs);
      setInfo(json);
    } catch (e) {
      console.error('[MapPage] Error:', e.message);
      setError('데이터를 불러오지 못했습니다.\n' + e.message + '\n(F12 개발자도구 Console 탭에서 "[MapPage]" 로그 확인)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">지도에서 위치 선택</h2>
      <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        🗺️ 지도를 클릭해 핀을 꽂고 그 위치의 바다 날씨 정보를 확인하세요!
      </p>
      
      <MapComponent 
        center={[36.5, 127.5]} 
        zoom={7} 
        markers={marker ? [{ id: 'sel', title: '선택 위치', lat: marker.lat, lng: marker.lng }] : []} 
        onMapClick={handleMapClick} 
      />

      {loading && <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '16px' }}>📍 데이터를 불러오는 중입니다...</p>}
      {error && <p className="error-message" style={{ marginTop: '20px' }}>⚠️ {error}</p>}
      
      {info && (
        <div style={{ marginTop: '30px' }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
            <h3>📍 {info.nearestObs?.name || '선택된 위치'}</h3>
            <div style={{fontSize:12, color:'#666'}}>
              좌표: {marker.lat.toFixed(3)}, {marker.lng.toFixed(3)}
            </div>
          </div>

          <div className="info-cards">
            <div className="card">
              <h3>☀️ 날씨 {info.weatherError && <span style={{color:'#a33', fontSize:12, marginLeft:8}}>(데이터 일부 없음)</span>}</h3>
              <p>상태: {getWeatherStatus(info.weather?.SKY, info.weather?.PTY) ?? 'N/A'}</p>
              <p>기온: {info.weather?.T1H ?? info.weather?.TMP ?? 'N/A'}°C</p>
              <p>풍속: {info.weather?.WSD ?? 'N/A'} m/s</p>
            </div>

            <div className="card">
              <h3>🌊 해양 정보</h3>
              <p>수온: {info.scuba?.water_temp ?? 'N/A'}°C</p>
              <p>파고: {info.scuba?.wave_height ?? 'N/A'} m</p>
              <p>유속: {info.scuba?.current_speed ?? 'N/A'} knots</p>
            </div>

            <div className="card">
              <h3>🌊 물때 {info.nearestObs && <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666'}}>({info.nearestObs.name})</span>}</h3>
              {info.tideError ? (
                <p style={{color:'#a33'}}>조석 데이터를 불러올 수 없습니다.</p>
              ) : info.tide && info.tide.length > 0 ? (
                renderTideList(info.tide)
              ) : <p>물때 정보가 없습니다.</p>}
            </div>
          </div>

          <p style={{fontSize: '12px', color: '#888', textAlign: 'center', margin: '16px 0'}}>출처: 오픈API 기상청_단기예보 / 해양수산부 국립해양조사원_스킨스쿠버지수 조회 / 해양수산부 국립해양조사원_조석예보</p>

          <AdSense slot="6789012345" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />
        </div>
      )}

      {!info && !loading && !error && marker && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>선택한 위치의 데이터를 준비 중...</p>
        </div>
      )}

      {!marker && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#1976d2' }}>지도를 클릭해 위치를 선택해주세요!</p>
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link to="/weather" className="nav-button" style={{ marginRight: '10px' }}>
          ⬅️ 바다날씨
        </Link>
        <Link to="/" className="nav-button">🏠 홈으로</Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/jp-wave" element={<JapanWaves />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/points-admin" element={<PointsAdmin />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
