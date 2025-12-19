// frontend/src/pages/WeatherPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const WeatherPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const params = new URLSearchParams({ lat: latitude, lon: longitude });
          if (new URLSearchParams(window.location.search).get('sample') === 'true') {
            params.set('useSample', 'true');
          }
          const response = await fetch(`/api/sea-info?${params.toString()}`);
          if (!response.ok) {
            throw new Error(`서버 오류: ${response.statusText}`);
          }
          const result = await response.json();
          setData(result);
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('위치 정보를 가져올 수 없습니다. 브라우저의 위치 정보 접근 권한을 확인해주세요.');
        setLoading(false);
      }
    );
  }, []);

  const getWeatherStatus = (sky, pty) => {
    if (pty && pty !== '0') {
      const ptyMap = { '1': '비', '2': '비/눈', '3': '눈', '5': '빗방울', '6': '빗방울/눈날림', '7': '눈날림' };
      return ptyMap[pty] || '알 수 없음';
    }
    if (sky) {
      const skyMap = { '1': '맑음', '3': '구름많음', '4': '흐림' };
      return skyMap[sky] || '알 수 없음';
    }
    return '정보 없음';
  };

  const formatTideTime = (t) => {
    if (!t) return '';
    try { return t.substring(11, 16); } catch (e) { return t; }
  }

  const renderTideList = (tideArr) => {
    if (!tideArr || !tideArr.length) return null;
    const copy = [...tideArr].sort((a, b) => (a.tide_time || '').localeCompare(b.tide_time || ''));
    return (
      <ul className="tide-list">
        {copy.map((item, idx) => (
          <li key={idx} className="tide-item">
            <span className="tide-icon" aria-hidden>{item.hl_code === 'H' ? '⬆️' : '⬇️'}</span>
            <span className="tide-type">{item.hl_code === 'H' ? '고조' : '저조'}</span>
            <span className="tide-time">{formatTideTime(item.tide_time)}</span>
            <span className="tide-level">({item.tide_level}cm)</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderErrorCard = (title, errorMessage) => (
    <div className="card error">
      <h3>{title}</h3>
      <p>데이터를 불러오지 못했습니다.</p>
      <p className="error-detail">{errorMessage}</p>
    </div>
  );

  return (
    <div className="container">
      <h2 className="page-title">현재 위치 바다 정보</h2>
      {loading && <p>데이터를 불러오는 중입니다...</p>}
      {error && !data && <p className="error-message">오류: {error}</p>}
      {data && (
        <>
          <div className="location-header">
            <h3>위치: {data.nearestObs?.name || '알 수 없음'}</h3>
            <div className="debug-info">
              기록: {data.recorded ? '성공' : '실패'}
              {data.usingMockData && ' • 테스트 데이터'}
            </div>
          </div>

          <div className="info-cards">
            {data.weatherError ? renderErrorCard('날씨', data.weatherError) : (
              <div className="card">
                <h3>날씨</h3>
                <p>상태: {getWeatherStatus(data.weather?.SKY, data.weather?.PTY)}</p>
                <p>기온: {data.weather?.T1H ?? 'N/A'}°C</p>
                <p>풍속: {data.weather?.WSD ?? 'N/A'} m/s</p>
              </div>
            )}

            {data.scubaError ? renderErrorCard('해양 정보', data.scubaError) : (
              <div className="card">
                <h3>해양 정보</h3>
                <p>수온: {data.scuba?.water_temp ?? 'N/A'}°C</p>
                <p>파고: {data.scuba?.wave_height ?? 'N/A'} m</p>
                <p>유속: {data.scuba?.current_speed ?? 'N/A'} knots</p>
              </div>
            )}

            {data.tideError ? renderErrorCard('오늘의 물때', data.tideError) : (
              <div className="card">
                <h3>오늘의 물때</h3>
                {data.tide && data.tide.length > 0 ? renderTideList(data.tide) : <p>물때 정보가 없습니다.</p>}
              </div>
            )}
          </div>
        </>
      )}
      <div className="page-actions">
        <Link to="/map" className="nav-button">지도 보기</Link>
        <Link to="/" className="nav-button">홈으로</Link>
      </div>
    </div>
  );
};

export default WeatherPage;