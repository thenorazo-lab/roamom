

import React, { useEffect, useState } from 'react';

export default function JapanWaves() {
  const [waves, setWaves] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      const corsProxy = 'https://corsproxy.io/?';
      const area = 1;
      const results = [];
      for (let i = 0; i <= 24; i++) {
        try {
          const url = `https://www.imocwx.com/cwm.php?Area=${area}&Time=${i}`;
          const resp = await fetch(corsProxy + encodeURIComponent(url));
          const html = await resp.text();
          const parser = new window.DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          let label = '';
          const titleEl = doc.querySelector('p.title');
          if (titleEl) {
            const txt = titleEl.textContent.replace(/\u00A0/g, ' ').trim();
            const match = txt.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\((日|月|火|水|木|金|土)\)(\d{1,2})時/);
            if (match) {
              const weekMap = { '日':'일', '月':'월', '火':'화', '水':'수', '木':'목', '金':'금', '土':'토' };
              label = `${match[1]}년 ${match[2]}월 ${match[3]}일 (${weekMap[match[4]]}) ${match[5]}시`;
            }
          }
          if (!label) {
            const textEls = doc.querySelectorAll('div, p, span');
            for (const el of textEls) {
              const txt = el.textContent.trim();
              const match = txt.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2})時\((日|月|火|水|木|金|土)\)/);
              if (match) {
                const weekMap = { '日':'일', '月':'월', '火':'화', '水':'수', '木':'목', '금':'금', '土':'토' };
                label = `${match[1]}년 ${match[2]}월 ${match[3]}일 ${match[4]}시 (${weekMap[match[5]]})`;
                break;
              }
            }
          }
          const imgIdx = String(i).padStart(2, '0');
          // 캐시 방지용 타임스탬프를 추가한 고정 URL 사용
          const imgUrl = `https://www.imocwx.com/cwm/cwmsjp_${imgIdx}.png?${Date.now()}`;
          results.push({ label, imgUrl });
        } catch (e) {
          results.push({ label: '', imgUrl: '', error: e.message });
        }
      }
      setWaves(results);
    };
    fetchAll();
  }, []);

  return (
    <div style={{maxWidth:800, width:'100%', margin:'0 auto', padding:'16px 0', background:'#eaf6fb'}}>
      <h2 style={{textAlign:'center',fontSize:28,fontWeight:700,margin:'16px 0 8px'}}>일본 기상청 파고</h2>
      {waves.length === 0 ? (
        <p style={{textAlign:'center',fontSize:18}}>파고 데이터를 불러오는 중...</p>
      ) : (
        <>
          <img src={waves[idx].imgUrl} alt={waves[idx].label} style={{display:'block',margin:'0 auto',maxHeight:480,maxWidth:'100%',border:'2px solid #2b7',background:'#f8f8f8',boxShadow:'0 2px 12px #0002'}} onError={e=>e.target.style.opacity=0.3} />
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',margin:'18px 0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
              <button onClick={()=>setIdx(i=>(i-1+waves.length)%waves.length)} style={{padding:'8px 16px', cursor:'pointer', fontSize:18, border:'1px solid #2b7', borderRadius:6, background:'white'}}>◀</button>
              <span style={{fontSize:22,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',textAlign:'center',width:'100%'}}>
                {waves[idx].label ? waves[idx].label : `${idx}번째 (파싱 실패)`}
                {waves[idx].error && <span style={{color:'red',marginLeft:8}}> - 에러: {waves[idx].error}</span>}
              </span>
              <button onClick={()=>setIdx(i=>(i+1)%waves.length)} style={{padding:'8px 16px', cursor:'pointer', fontSize:18, border:'1px solid #2b7', borderRadius:6, background:'white'}}>▶</button>
            </div>
          </div>
          <div style={{display:'flex',gap:8,overflowX:'auto',margin:'0 0 8px 0',width:'100%',boxSizing:'border-box',paddingBottom:8}}>
            {waves.map((w,i)=>(
              <img
                key={i}
                src={w.imgUrl}
                alt={w.label}
                style={{ width:80, height:48, objectFit:'contain', border: i===idx ? '3px solid #2b7' : '1px solid #ccc', cursor:'pointer', flexShrink:0, background:'#f8f8f8', opacity: 1 }}
                onClick={()=>setIdx(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
