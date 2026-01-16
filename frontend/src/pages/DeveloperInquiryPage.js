import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdSense from '../components/AdSense';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function DeveloperInquiryPage() {
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !title || !lat || !lng || !desc) {
      alert('모든 필드를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/inquiry`, { email, title, lat: parseFloat(lat), lng: parseFloat(lng), desc });
      alert('포인트 제보가 성공적으로 전송되었습니다.');
      setEmail('');
      setTitle('');
      setLat('');
      setLng('');
      setDesc('');
    } catch (error) {
      alert('전송에 실패했습니다: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <AdSense slot="3456789012" format="horizontal" style={{ display: 'block', width: '100%', height: '90px', margin: '10px 0' }} />
      <h2 className="page-title">� 포인트 제보&개발자 문의</h2>
      <div style={{marginTop: '10px', marginBottom: '20px', textAlign: 'center'}}>
        <Link to="/" className="nav-button">🏠 홈으로</Link>
      </div>
      <div style={{maxWidth: '600px', margin: '0 auto', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
        <p style={{textAlign: 'center', color: '#555', marginBottom: '20px'}}>
          해루질 포인트 제보 또는 개발자 문의
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>이메일 주소:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px'}}
              placeholder="your@email.com"
              required
            />
          </div>
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>포인트 제목:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px'}}
              placeholder="포인트 제목"
              required
            />
          </div>
          <div style={{marginBottom: '15px', display: 'flex', gap: '10px'}}>
            <div style={{flex: 1}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>위도 (Latitude):</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px'}}
                placeholder="예: 35.1234"
                required
              />
            </div>
            <div style={{flex: 1}}>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>경도 (Longitude):</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px'}}
                placeholder="예: 129.5678"
                required
              />
            </div>
          </div>
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>설명:</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', minHeight: '100px', resize: 'vertical'}}
              placeholder="포인트 설명"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#0077be',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '전송 중...' : '전송'}
          </button>
        </form>
      </div>
    </div>
  );
}