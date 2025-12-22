// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import MapComponent from './components/MapComponent';
import PointsAdmin from './pages/PointsAdmin';
import JapanWaves from './pages/JapanWaves';
import AdSense from './components/AdSense';

// ��������(file://) ���� ���� ������
const getSampleSeaInfo = () => ({
  nearestObs: { name: '���� ������' },
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

// ���̵� ������
const GuidePage = () => (
  <div className="container">
    <h2 className="page-title">?? �ط��� ���̵�</h2>
    <div style={{maxWidth: '800px', textAlign: 'left', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
      <h3>?? �ط����̶�?</h3>
      <p>�ط����� �ٴ尡���� ����, �Ҷ�, ���� �� �ػ깰�� ä���ϴ� �������� Ȱ���Դϴ�.</p>
      
      <h3>?? ������ �ط����� ���� ��</h3>
      <ul>
        <li>���� �ð��� Ȯ���ϼ���</li>
        <li>�İ��� ���� ���� �����ϼ���</li>
        <li>���°� ��� ���¸� üũ�ϼ���</li>
        <li>���� ��� �����ϼ���</li>
      </ul>
      
      <h3>?? �� �� ����</h3>
      <ul>
        <li><strong>�ٴٳ���:</strong> �ǽð� �ٴ� ��� ���� Ȯ��</li>
        <li><strong>�Ϻ� �İ�:</strong> �Ϻ� �ֺ� �İ� ���� Ȯ��</li>
        <li><strong>�ط��� ����Ʈ:</strong> ��õ �ط��� ��� Ž��</li>
      </ul>
      
      <h3>?? ��ŷ �ط��� ���̵� ����</h3>
      <p>
        <a href="https://roafather.tistory.com/entry/%EC%9B%8C%ED%82%B9%ED%95%B4%EB%A3%A8%EC%A7%88-%EA%B0%80%EC%9D%B4%EB%93%9C" 
           target="_blank" 
           rel="noopener noreferrer" 
           style={{color:'#0077be', fontSize:'1.1rem', fontWeight:'600', textDecoration:'underline'}}>
          �� ��ŷ �ط��� ���̵� ��������
        </a>
      </p>
      
      <h3>?? ��Ų �ط��� ���̵� ����</h3>
      <p>
        <a href="https://roafather.tistory.com/entry/%EC%8A%A4%ED%82%A8-%ED%95%B4%EB%A3%A8%EC%A7%88-%EA%B0%80%EC%9D%B4%EB%93%9C" 
           target="_blank" 
           rel="noopener noreferrer" 
           style={{color:'#0077be', fontSize:'1.1rem', fontWeight:'600', textDecoration:'underline'}}>
          �� ��Ų �ط��� ���̵� ��������
        </a>
      </p>
    </div>
    <AdSense slot="2345678901" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />
    <div style={{marginTop: '24px'}}>
      <Link to="/" className="nav-button">?? Ȩ����</Link>
    </div>
  </div>
);

// Ȩ ȭ��
const HomePage = () => (
  <div className="container">
    <h1 className="main-title">�ط�������</h1>
    <p className="sub-title">�ٴٳ���, ����Ʈ, �Ϻ� �İ��� �� ������</p>
    <div className="nav-buttons">
      <Link to="/weather" className="nav-button">?? �ٴٳ���</Link>
      <Link to="/jp-wave" className="nav-button">?? �Ϻ� ���û �İ�</Link>
      <Link to="/points" className="nav-button">?? �ط��� ����Ʈ</Link>
      <Link to="/guide" className="nav-button">?? �ط��� ���̵�</Link>
      <Link to="/points-admin" className="nav-button" style={{fontSize: '0.6rem', padding: '8px 12px', maxWidth: '180px', alignSelf: 'center'}}>?? ����Ʈ ������</Link>
    </div>
    <AdSense slot="1234567890" />
  </div>
);

// �ٴٳ��� ������
const WeatherPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // file:// �� ������ ���� API ȣ�� ��� ���� �����͸� ���
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
          throw new Error(`���� ���� (${response.status}): ${response.statusText}. ${errorText}`);
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

    // 1) URL�� ��ǥ�� �Ѿ�� ��� �켱 ��� (��: ?lat=35.1&lon=129.1&sample=true)
    const qs = new URLSearchParams(window.location.search);
    const qsLat = qs.get('lat');
    const qsLon = qs.get('lon');
    if (qsLat && qsLon) {
      const useSample = qs.get('sample') === 'true';
      fetchWeatherData(qsLat, qsLon, useSample);
      return;
    }

    // 2) �׷��� ������ ������ ��ġ ���� �õ� (������/������ Ÿ�Ӿƿ� ����)
    if (!('geolocation' in navigator)) {
      fetchWeatherData(35.1, 129.1, true);
      return;
    }

    const timeoutMs = 5000;
    const timerId = setTimeout(() => {
      // ��ġ ���� ������ ������ ������ �� ���÷� ����
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
        // ���� �ź� �� ���� �� ���÷� ǥ��
        await fetchWeatherData(35.1, 129.1, true);
      }
    );
  }, []);

  const getWeatherStatus = (sky, pty) => {
    if (pty && pty !== '0') {
      if (pty === '1') return '��';
      if (pty === '2') return '��/��';
      if (pty === '3') return '��';
      if (pty === '5') return '�����';
      if (pty === '6') return '�����/������';
      if (pty === '7') return '������';
    }
    if (sky) {
      if (sky === '1') return '����';
      if (sky === '3') return '��������';
      if (sky === '4') return '�帲';
    }
    return '���� ����';
  };

  const formatTideTime = (t) => {
    if (!t) return '';
    try { return t.substring(11, 16); } catch { return t; }
  };

  const extractHighLowTides = (tideArr) => {
    if (!tideArr || !tideArr.length) return [];
    // �̹� H/L �±װ� ������ �װ͸� ���͸�
    const hlOnly = tideArr.filter(t => t.hl_code === 'H' || t.hl_code === 'L');
    if (hlOnly.length > 0) return hlOnly;
    // ������ �ְ�/�������� ����
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
    if (!filtered.length) return <p style={{color:'#666'}}>����/���� ������ �����ϴ�.</p>;
    
    // ��¥���� �׷���
    const groupedByDate = {};
    filtered.forEach(item => {
      const fullTime = item.tide_time || item.record_time;
      const dateStr = fullTime ? fullTime.substring(0, 10) : '';
      if (!dateStr) return;
      
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { high: [], low: [] };
      }
      
      if (item.hl_code === 'H') {
        groupedByDate[dateStr].high.push(item);
      } else if (item.hl_code === 'L') {
        groupedByDate[dateStr].low.push(item);
      }
    });
    
    const sortedDates = Object.keys(groupedByDate).sort();
    
    const renderTideItem = (item) => {
      const change = calculateTideChange(tideArr, item);
      const changeText = change !== null ? (change >= 0 ? `��+${change}` : `��${change}`) : '';
      return (
        <div key={`${item.tide_time || item.record_time}`} style={{marginBottom:'8px', fontSize:'14px'}}>
          <span style={{marginRight:'12px'}}>{formatTideTime(item.tide_time || item.record_time)}</span>
          <span style={{marginRight:'12px'}}>({item.tide_level})</span>
          <span style={{color:'#666'}}>{changeText}</span>
        </div>
      );
    };
    
    const formatDateLabel = (dateStr) => {
      const today = new Date();
      const todayStr = today.toISOString().substring(0, 10);
      if (dateStr === todayStr) return `���� (${dateStr.substring(5).replace('-', '/')})`;
      
      return dateStr.substring(5).replace('-', '/');
    };

    return (
      <div style={{fontSize:'14px'}}>
        {sortedDates.map(dateStr => {
          const { high, low } = groupedByDate[dateStr];
          return (
            <div key={dateStr} style={{marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid #eee'}}>
              <div style={{fontWeight:'bold', fontSize:'15px', color:'#333', marginBottom:'12px'}}>
                ?? {formatDateLabel(dateStr)}
              </div>
              
              {high.length > 0 && (
                <div style={{marginBottom:'12px'}}>
                  <div style={{fontWeight:'bold', marginBottom:'8px', color:'#2196F3', fontSize:'13px'}}>�� ����</div>
                  {high.map(renderTideItem)}
                </div>
              )}
              
              {low.length > 0 && (
                <div>
                  <div style={{fontWeight:'bold', marginBottom:'8px', color:'#f44336', fontSize:'13px'}}>�� ����</div>
                  {low.map(renderTideItem)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container">
      <h2 className="page-title">���� ��ġ �ٴ� ����</h2>
      {loading && <p>�����͸� �ҷ����� ���Դϴ�...</p>}
      {error && <p className="error-message">����: {error}</p>}
      {data && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3>��ġ: {data.nearestObs?.name || '���� ��ġ'}</h3>
            <div style={{fontSize:12, color:'#666'}}>��� ����: {data.recorded ? '��ϵ�' : '��� ����/��Ȱ��'}{data.usingMockData ? ' (���� ������ ��� ��)' : ''}</div>
          </div>

          <div className="info-cards">
            <div className="card">
              <h3>?? ���� {data.weatherError && <span style={{color:'#a33', fontSize:12, marginLeft:8}}>(������ �Ϻ� ����)</span>}</h3>
              <p>����: {getWeatherStatus(data.weather?.SKY, data.weather?.PTY) ?? '���� ����'}</p>
              <p>���: {data.weather?.T1H ?? data.weather?.TMP ?? 'N/A'}��C</p>
              <p>ǳ��: {data.weather?.WSD ?? 'N/A'} m/s</p>
            </div>

            <div className="card">
              <h3>?? �ؾ� ����</h3>
              <p>����: {data.scuba?.water_temp ?? 'N/A'}��C</p>
              <p>�İ�: {data.scuba?.wave_height ?? 'N/A'} m</p>
              <p>����: {data.scuba?.current_speed ?? 'N/A'} knots</p>
            </div>

            <div className="card">
              <h3>?? ����</h3>
              {data.tideError ? (
                <div style={{color:'#a33'}}>���� �����͸� �ҷ����� ���߽��ϴ�.</div>
              ) : data.tide && data.tide.length > 0 ? (
                <div style={{maxHeight:'400px', overflowY:'auto'}}>
                  {renderTideList(data.tide)}
                </div>
              ) : <p>���� ������ �����ϴ�.</p>}
            </div>
          </div>

          <p style={{fontSize: '12px', color: '#888', textAlign: 'center', margin: '16px 0'}}>��ó: ����API ���û_�ܱ⿹�� / �ؾ����� �����ؾ������_��Ų���������� ��ȸ / �ؾ����� �����ؾ������_��������</p>

          <AdSense slot="4567890123" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/map" className="nav-button" style={{ backgroundColor: '#2196F3', marginRight: '10px' }}>
              ??? ���� ����
            </Link>
            <Link to="/" className="nav-button">?? Ȩ����</Link>
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
      <h2 className="page-title">?? �ط��� ����Ʈ</h2>
      <p>������ ����Ʈ�� ���� ������ Ȯ���ϰ� ���α� ���� �о����.</p>
      <p style={{fontSize: '14px', color: '#666', marginTop: '8px'}}>�����ϰ� ���� ����Ʈ�� thenorazo@gmail.com �� �������ּ���!</p>
      <MapComponent center={[36.5, 127.5]} zoom={7} markers={points} onMapClick={() => {}} onMarkerClick={handleMarkerClick} />
      <AdSense slot="5678901234" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />
      <Link to="/" className="nav-button" style={{marginTop: '20px'}}>?? Ȩ����</Link>
    </div>
  );
};

const MapPage = () => {
  const [marker, setMarker] = React.useState(null);
  const [info, setInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // file:// �� ������ ���� API ȣ�� ��� ���� �����͸� ���
  React.useEffect(() => {
    if (window.location.protocol === 'file:') {
      setInfo(getSampleSeaInfo());
    }
  }, []);

  const getWeatherStatus = (sky, pty) => {
    if (pty && pty !== '0') {
      if (pty === '1') return '��';
      if (pty === '2') return '��/��';
      if (pty === '3') return '��';
      if (pty === '5') return '�����';
      if (pty === '6') return '�����/������';
      if (pty === '7') return '������';
    }
    if (sky) {
      if (sky === '1') return '����';
      if (sky === '3') return '��������';
      if (sky === '4') return '�帲';
    }
    return '���� ����';
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
    if (!filtered.length) return <p style={{color:'#666'}}>����/���� ������ �����ϴ�.</p>;
    
    // ��¥���� �׷���
    const groupedByDate = {};
    filtered.forEach(item => {
      const fullTime = item.tide_time || item.record_time;
      const dateStr = fullTime ? fullTime.substring(0, 10) : '';
      if (!dateStr) return;
      
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { high: [], low: [] };
      }
      
      if (item.hl_code === 'H') {
        groupedByDate[dateStr].high.push(item);
      } else if (item.hl_code === 'L') {
        groupedByDate[dateStr].low.push(item);
      }
    });
    
    const sortedDates = Object.keys(groupedByDate).sort();
    
    const renderTideItem = (item) => {
      const change = calculateTideChange(tideArr, item);
      const changeText = change !== null ? (change >= 0 ? `��+${change}` : `��${change}`) : '';
      return (
        <div key={`${item.tide_time || item.record_time}`} style={{marginBottom:'8px', fontSize:'14px'}}>
          <span style={{marginRight:'12px'}}>{formatTideTime(item.tide_time || item.record_time)}</span>
          <span style={{marginRight:'12px'}}>({item.tide_level})</span>
          <span style={{color:'#666'}}>{changeText}</span>
        </div>
      );
    };
    
    const formatDateLabel = (dateStr) => {
      const today = new Date();
      const todayStr = today.toISOString().substring(0, 10);
      if (dateStr === todayStr) return `���� (${dateStr.substring(5).replace('-', '/')})`;
      
      return dateStr.substring(5).replace('-', '/');
    };

    return (
      <div style={{fontSize:'14px'}}>
        {sortedDates.map(dateStr => {
          const { high, low } = groupedByDate[dateStr];
          return (
            <div key={dateStr} style={{marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid #eee'}}>
              <div style={{fontWeight:'bold', fontSize:'15px', color:'#333', marginBottom:'12px'}}>
                ?? {formatDateLabel(dateStr)}
              </div>
              
              {high.length > 0 && (
                <div style={{marginBottom:'12px'}}>
                  <div style={{fontWeight:'bold', marginBottom:'8px', color:'#2196F3', fontSize:'13px'}}>�� ����</div>
                  {high.map(renderTideItem)}
                </div>
              )}
              
              {low.length > 0 && (
                <div>
                  <div style={{fontWeight:'bold', marginBottom:'8px', color:'#f44336', fontSize:'13px'}}>�� ����</div>
                  {low.map(renderTideItem)}
                </div>
              )}
            </div>
          );
        })}
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
      setError('�����͸� �ҷ����� ���߽��ϴ�.\n' + e.message + '\n(F12 �����ڵ��� Console �ǿ��� "[MapPage]" �α� Ȯ��)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">�������� ��ġ ����</h2>
      <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        ??? ������ Ŭ���� ���� �Ȱ� �� ��ġ�� �ٴ� ���� ������ Ȯ���ϼ���!
      </p>
      
      <MapComponent 
        center={[36.5, 127.5]} 
        zoom={7} 
        markers={marker ? [{ id: 'sel', title: '���� ��ġ', lat: marker.lat, lng: marker.lng }] : []} 
        onMapClick={handleMapClick} 
      />

      {loading && <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '16px' }}>?? �����͸� �ҷ����� ���Դϴ�...</p>}
      {error && <p className="error-message" style={{ marginTop: '20px' }}>?? {error}</p>}
      
      {info && (
        <div style={{ marginTop: '30px' }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
            <h3>?? {info.nearestObs?.name || '���õ� ��ġ'}</h3>
            <div style={{fontSize:12, color:'#666'}}>
              ��ǥ: {marker.lat.toFixed(3)}, {marker.lng.toFixed(3)}
            </div>
          </div>

          <div className="info-cards">
            <div className="card">
              <h3>?? ���� {info.weatherError && <span style={{color:'#a33', fontSize:12, marginLeft:8}}>(������ �Ϻ� ����)</span>}</h3>
              <p>����: {getWeatherStatus(info.weather?.SKY, info.weather?.PTY) ?? 'N/A'}</p>
              <p>���: {info.weather?.T1H ?? info.weather?.TMP ?? 'N/A'}��C</p>
              <p>ǳ��: {info.weather?.WSD ?? 'N/A'} m/s</p>
            </div>

            <div className="card">
              <h3>?? �ؾ� ����</h3>
              <p>����: {info.scuba?.water_temp ?? 'N/A'}��C</p>
              <p>�İ�: {info.scuba?.wave_height ?? 'N/A'} m</p>
              <p>����: {info.scuba?.current_speed ?? 'N/A'} knots</p>
            </div>

            <div className="card">
              <h3>?? ���� {info.nearestObs && <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666'}}>({info.nearestObs.name})</span>}</h3>
              {info.tideError ? (
                <p style={{color:'#a33'}}>���� �����͸� �ҷ��� �� �����ϴ�.</p>
              ) : info.tide && info.tide.length > 0 ? (
                <div style={{maxHeight:'400px', overflowY:'auto'}}>
                  {renderTideList(info.tide)}
                </div>
              ) : <p>���� ������ �����ϴ�.</p>}
            </div>
          </div>

          <p style={{fontSize: '12px', color: '#888', textAlign: 'center', margin: '16px 0'}}>��ó: ����API ���û_�ܱ⿹�� / �ؾ����� �����ؾ������_��Ų���������� ��ȸ / �ؾ����� �����ؾ������_��������</p>

          <AdSense slot="6789012345" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />
        </div>
      )}

      {!info && !loading && !error && marker && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>������ ��ġ�� �����͸� �غ� ��...</p>
        </div>
      )}

      {!marker && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#1976d2' }}>������ Ŭ���� ��ġ�� �������ּ���!</p>
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link to="/weather" className="nav-button" style={{ marginRight: '10px' }}>
          ?? �ٴٳ���
        </Link>
        <Link to="/" className="nav-button">?? Ȩ����</Link>
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


