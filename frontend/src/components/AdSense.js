// components/AdSense.js
import React, { useEffect } from 'react';

export default function AdSense({ 
  slot = '0000000000', 
  format = 'auto',
  responsive = true,
  style = { display: 'block', textAlign: 'center', minHeight: '100px' }
}) {
  const clientId = process.env.REACT_APP_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (clientId && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [clientId]);

  // AdSense 승인 전에는 플레이스홀더 표시
  if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
    return (
      <div style={{
        ...style,
        background: '#f0f0f0',
        border: '2px dashed #ccc',
        padding: '20px',
        margin: '20px 0',
        borderRadius: '8px',
        color: '#666'
      }}>
        <p style={{margin: 0, fontSize: '14px'}}>📢 광고 영역 (AdSense 승인 후 표시)</p>
      </div>
    );
  }

  return (
    <div style={{ margin: '20px 0', textAlign: 'center' }}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}
