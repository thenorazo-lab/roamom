// frontend/src/pages/MidForecastPage.js
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdSense from '../components/AdSense';

const API_BASE_URL = 'https://roamom-backend.onrender.com';

const MidForecastPage = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [tempData, setTempData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [regionInfo, setRegionInfo] = useState({ name: '', regId: '' });

  useEffect(() => {
    // URL 파라미터에서 위치 확인
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    const fetchForecast = async (latitude, longitude) => {
      try {
        // 중기전망 API 호출
        const forecastRes = await fetch(
          `${API_BASE_URL}/api/mid-forecast?lat=${latitude}&lon=${longitude}`
        );

        // 중기기온 API 호출
        const tempRes = await fetch(
          `${API_BASE_URL}/api/mid-temp?lat=${latitude}&lon=${longitude}`
        );

        const forecastData = await forecastRes.json();
        const tempDataRes = await tempRes.json();

        console.log('[MidForecast] Forecast response:', forecastData);
        console.log('[MidForecast] Temp response:', tempDataRes);

        if (!forecastRes.ok) {
          throw new Error(`중기전망 API 오류: ${forecastData.error || forecastData.detail || '알 수 없는 오류'}`);
        }

        if (!tempRes.ok) {
          throw new Error(`중기기온 API 오류: ${tempDataRes.error || tempDataRes.detail || '알 수 없는 오류'}`);
        }

        if (!forecastData.success || !tempDataRes.success) {
          throw new Error(`API 응답 오류: ${forecastData.error || tempDataRes.error || '데이터를 불러올 수 없습니다'}`);
        }

        setData(forecastData.data);
        setTempData(tempDataRes.data);
        setRegionInfo({
          name: forecastData.regionName || tempDataRes.regionName || '알 수 없음',
          regId: forecastData.regId || tempDataRes.regId || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('[MidForecast] Error:', err);
        setError(`중기예보를 불러오지 못했습니다: ${err.message}`);
        setLoading(false);
      }
    };

    // URL 파라미터가 있으면 해당 위치, 없으면 현재 위치
    if (lat && lon) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      setLocation({ lat: latitude, lon: longitude });
      fetchForecast(latitude, longitude);
    } else {
      // 현재 위치 가져오기
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          fetchForecast(latitude, longitude);
        },
        (err) => {
          console.error('[MidForecast] Geolocation error:', err);
          setError('위치 정보를 가져올 수 없습니다.');
          setLoading(false);
        }
      );
    }
  }, [searchParams]);

  // 날씨 정보 파싱 함수 (5일 후부터 10일까지)
  const parseForecast = () => {
    if (!data || !tempData) return [];

    const days = [];
    const today = new Date();

    // 5일 후부터 10일까지
    for (let i = 5; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayStr = String(i);

      const dayInfo = {
        date: date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }),
        day: i,
        landAM: data[`wf${dayStr}Am`] || data[`wf${dayStr}`] || 'N/A',
        landPM: data[`wf${dayStr}Pm`] || data[`wf${dayStr}`] || 'N/A',
        rainAM: data[`rnSt${dayStr}Am`] || null,
        rainPM: data[`rnSt${dayStr}Pm`] || data[`rnSt${dayStr}`] || null,
        minTemp: tempData[`taMin${dayStr}`] || 'N/A',
        maxTemp: tempData[`taMax${dayStr}`] || 'N/A',
      };

      days.push(dayInfo);
    }

    return days;
  };

  const forecast = parseForecast();

  return (
    <div className="container">
      <AdSense slot="7890123456" format="horizontal" style={{ display: 'block', width: '100%', height: '90px', margin: '10px 0' }} />

      <h2 className="page-title">📅 중기예보 (3~10일)</h2>

      <div style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'center' }}>
        <Link to="/weather" className="nav-button" style={{ backgroundColor: '#2196F3', marginRight: '10px' }}>
          ⬅️ 바다날씨
        </Link>
        <Link to="/" className="nav-button">🏠 홈으로</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌤️</div>
          <p>중기예보를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p className="error-message">{error}</p>
        </div>
      ) : (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '16px', margin: 0, fontWeight: 'bold' }}>
              📍 {regionInfo.name}
            </p>
            <p style={{ fontSize: '14px', marginTop: '8px', marginBottom: '5px' }}>
              ℹ️ 3일 후부터 10일 후까지의 예보입니다
            </p>
            <p style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
              하루 2회(06시, 18시) 발표
            </p>
          </div>

          {forecast.map((day, index) => (
            <div key={index} className="card" style={{ marginBottom: '15px', padding: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                borderBottom: '2px solid #e0e0e0',
                paddingBottom: '10px'
              }}>
                <h3 style={{ margin: 0, color: '#333' }}>{day.date}</h3>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                  {day.minTemp}° ~ {day.maxTemp}°
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* 오전 */}
                <div style={{
                  background: '#fff3e0',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ffb74d'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#e65100', marginBottom: '8px' }}>
                    🌅 오전
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>날씨:</strong> {day.landAM}
                    </div>
                    {day.rainAM !== null && (
                      <div style={{ color: '#1976d2', fontSize: '13px' }}>
                        💧 강수확률: {day.rainAM}%
                      </div>
                    )}
                  </div>
                </div>

                {/* 오후 */}
                <div style={{
                  background: '#e3f2fd',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #64b5f6'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#0d47a1', marginBottom: '8px' }}>
                    🌆 오후
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>날씨:</strong> {day.landPM}
                    </div>
                    {day.rainPM !== null && (
                      <div style={{ color: '#1976d2', fontSize: '13px' }}>
                        💧 강수확률: {day.rainPM}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <p style={{
            fontSize: '12px',
            color: '#888',
            textAlign: 'center',
            margin: '20px 0',
            padding: '15px',
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            📌 출처: 기상청_중기예보 조회서비스
          </p>
        </div>
      )}

      <AdSense slot="8901234567" style={{ display: 'block', margin: '20px auto' }} />
    </div>
  );
};

export default MidForecastPage;
