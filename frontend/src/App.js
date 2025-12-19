// frontend/src/App.js (fixed encoding and JSX)

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import MapComponent from './components/MapComponent';
import PointsAdmin from './pages/PointsAdmin';
import JapanWaves from './pages/JapanWaves';

// 홈 화면
const HomePage = () => (
  <div className="container">
    <h1 className="main-title">해루질가자</h1>
    <p className="sub-title">바다날씨, 포인트, 일본 파고를 한 곳에서</p>
    <div className="nav-buttons">
      <Link to="/weather" className="nav-button">🌊 바다날씨</Link>
      <Link to="/jp-wave" className="nav-button">🇯🇵 일본 파고</Link>
      <Link to="/points" className="nav-button">📍 포인트</Link>
      <Link to="/points-admin" className="nav-button">⚙️ 포인트 관리자</Link>
    </div>
  </div>
);

// 바다날씨 페이지
const WeatherPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

        const url = `/api/sea-info?${params.toString()}`;
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

  const renderTideList = (tideArr) => {
    if (!tideArr || !tideArr.length) return null;
    const copy = tideArr.slice().sort((a,b)=> ((a.tide_time || a.record_time || '')).localeCompare((b.tide_time || b.record_time || '')));
    return (
      <ul className="tide-list">
        {copy.map((item, idx) => (
          <li key={idx} className="tide-item">
            <span className="tide-icon" aria-hidden>{item.hl_code === 'H' ? '⬆️' : item.hl_code === 'L' ? '⬇️' : '🔹'}</span>
            <span className="tide-type">{item.hl_code === 'H' ? '고조' : item.hl_code === 'L' ? '저조' : '관측'}</span>
            <span className="tide-time">{formatTideTime(item.tide_time || item.record_time)}</span>
            <span className="tide-level">({item.tide_level}cm)</span>
          </li>
        ))}
      </ul>
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
              <h3>🌊 해양 정보 {data.scubaError && <span style={{color:'#a33', fontSize:12, marginLeft:8}}>(데이터 일부 없음)</span>}</h3>
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
    fetch('/api/points')
      .then(r => r.json())
      .then(setPoints)
      .catch(() => setPoints([]));
  }, []);

  return (
    <div className="container">
      <h2 className="page-title">포인트 목록</h2>
      <p>지도의 포인트를 눌러 정보를 확인해보세요.</p>
      <MapComponent center={[36.5, 127.5]} zoom={7} markers={points} onMapClick={() => {}} />
      <Link to="/" className="nav-button" style={{marginTop: '20px'}}>🏠 홈으로</Link>
    </div>
  );
};

const MapPage = () => {
  const [marker, setMarker] = React.useState(null);
  const [info, setInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

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

  const handleMapClick = async (latlng) => {
    setMarker(latlng);
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      // 지도 클릭 위치의 실제 데이터를 API에서 받음 (cache bust)
      const url = `/api/sea-info?lat=${latlng.lat}&lon=${latlng.lng}&_ts=${Date.now()}`;
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
              醫뚰몴: {marker.lat.toFixed(3)}, {marker.lng.toFixed(3)}
            </div>
          </div>

          <div className="info-cards">
            {/* 날씨 카드 */}
            <div className="card">
              <h3>☀️ 날씨 {info.weatherError && <span style={{color:'#a33', fontSize:12, marginLeft:8}}>(데이터 일부 없음)</span>}</h3>
              <p>상태: {getWeatherStatus(info.weather?.SKY, info.weather?.PTY) ?? 'N/A'}</p>
              <p>기온: {info.weather?.T1H ?? info.weather?.TMP ?? 'N/A'}°C</p>
              <p>풍속: {info.weather?.WSD ?? 'N/A'} m/s</p>
            </div>

            {/* 해양 정보 카드 */}
            <div className="card">
              <h3>🌊 해양 정보 {info.scubaError && <span style={{color:'#a33', fontSize:12, marginLeft:8}}>(데이터 일부 없음)</span>}</h3>
              <p>수온: {info.scuba?.water_temp ?? 'N/A'}°C</p>
              <p>파고: {info.scuba?.wave_height ?? 'N/A'} m</p>
              <p>유속: {info.scuba?.current_speed ?? 'N/A'} knots</p>
            </div>

            {/* 물때 카드 */}
            <div className="card">
              <h3>?뙄 臾쇰븣 ?뺣낫</h3>
              {info.tideError ? (
                <p style={{color:'#a33'}}>물때 데이터를 불러올 수 없습니다.</p>
              ) : info.tide && info.tide.length > 0 ? (
                <ul className="tide-list">
                  {info.tide.slice().sort((a,b)=> (a.tide_time||'').localeCompare(b.tide_time||'')).slice(0, 12).map((item, idx) => (
                    <li key={idx} className="tide-item">
                      <span className="tide-icon">{item.hl_code === 'H' ? '⬆️' : item.hl_code === 'L' ? '⬇️' : '🔹'}</span>
                      <span className="tide-type">{item.hl_code === 'H' ? '고조' : item.hl_code === 'L' ? '저조' : '관측'}</span>
                      <span className="tide-time">{(item.tide_time || item.record_time) ? (item.tide_time || item.record_time).substring(11, 16) : 'N/A'}</span>
                      <span className="tide-level">({item.tide_level}cm)</span>
                    </li>
                  ))}
                </ul>
              ) : <p>臾쇰븣 ?뺣낫媛 ?놁뒿?덈떎.</p>}
            </div>
          </div>
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
          <Route path="/points" element={<PointsPage />} />
          <Route path="/points-admin" element={<PointsAdmin />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
