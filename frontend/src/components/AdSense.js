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

  // AdSense 승인 전에는 아무것도 표시하지 않음
  if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
    return null;
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
