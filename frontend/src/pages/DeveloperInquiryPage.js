import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdSense from '../components/AdSense';

const API_BASE_URL = 'https://able-tide-481608-m5.du.r.appspot.com';

export default function DeveloperInquiryPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) {
      alert('이메일과 문의 내용을 모두 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/inquiry`, { email, message });
      alert('문의가 성공적으로 전송되었습니다.');
      setEmail('');
      setMessage('');
    } catch (error) {
      alert('문의 전송에 실패했습니다. 다시 시도해 주세요.');
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
          답변 받으실 이메일 주소를 꼭 포함해서 문의해 주세요
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
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>문의 내용:</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', minHeight: '150px', resize: 'vertical'}}
              placeholder="문의 내용을 입력해 주세요..."
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