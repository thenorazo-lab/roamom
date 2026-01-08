import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AdSense from '../components/AdSense';

const API_BASE_URL = 'https://able-tide-481608-m5.du.r.appspot.com';

export default function JapanWaves(){
  const defaultDate = new Date().toISOString().slice(0,10);
  const [idx, setIdx] = useState(0);

  function buildPlaceholder(dateStr){
    const d = dateStr || new Date().toISOString().slice(0,10);
    const yyyymmdd = d.replace(/-/g,'');
    const hours = [0,3,6,9,12,15,18,21];
    return hours.map(h => {
      const hh = String(h).padStart(2,'0');
      const hhmm = `${hh}00`;
      return {
        time: `${d} ${hh}:00`,
        url: `https://placehold.co/800x380?text=Wave+${yyyymmdd}+${hhmm}`
      };
    });
  }

  const [images, setImages] = useState(buildPlaceholder(defaultDate));

  const fetchImages = useCallback(async () => {
    try{
      const res = await axios.get(`${API_BASE_URL}/api/japan-waves?date=${defaultDate}`);
      const imgs = res.data?.images || [];
      // 상대 경로를 절대 경로로 변환
      const imgsWithAbsoluteUrls = imgs.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${API_BASE_URL}${img.url}`
      }));
      setImages(imgsWithAbsoluteUrls.length > 0 ? imgsWithAbsoluteUrls : buildPlaceholder(defaultDate));
      setIdx(0);
    }catch(e){
      setImages(buildPlaceholder(defaultDate));
      setIdx(0);
    }
  }, [defaultDate]);

  // 처음 진입 시 오늘 날짜로 자동 로드
  useEffect(()=>{ fetchImages(); },[fetchImages]);

  function prev(){ setIdx(i => (i - 1 + images.length) % images.length); }
  function next(){ setIdx(i => (i + 1) % images.length); }

  return (
    <div className="container">
      <AdSense slot="3456789012" format="horizontal" style={{ display: 'block', width: '100%', height: '90px', margin: '10px 0' }} />
      <h2 className="page-title">일본 파고</h2>
      <div style={{marginTop: '10px', marginBottom: '20px', textAlign: 'center'}}>
        <Link to="/" className="nav-button">🏠 홈으로</Link>
      </div>
      {images.length===0 ? (
        <p>해당 날짜의 이미지가 없습니다.</p>
      ) : (
        <div style={{maxWidth:800, width:'100%'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <img src={images[idx].url} alt={images[idx].time} style={{maxHeight:380,maxWidth:'100%'}} crossOrigin="anonymous" referrerPolicy="no-referrer" onError={()=>{ setImages(buildPlaceholder(defaultDate)); setIdx(0); }} />
          </div>
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:4}}>
            <button onClick={prev} style={{padding:'8px 16px', cursor:'pointer', fontSize:18, border:'1px solid #ccc', borderRadius:4, background:'white'}}>◀</button>
            <div style={{textAlign:'center', fontSize:12, color:'#666'}}>ICOM 일본기상청 데이터</div>
            <button onClick={next} style={{padding:'8px 16px', cursor:'pointer', fontSize:18, border:'1px solid #ccc', borderRadius:4, background:'white'}}>▶</button>
          </div>
          <div style={{textAlign:'center',marginTop:8}}>{images[idx].time}</div>
          <div className="horizontal-scroll" style={{display:'flex',gap:8,overflowX:'auto',marginTop:12,width:'100%',boxSizing:'border-box',paddingBottom:8}}>
            {images.map((img,i)=> (
              <img
                key={i}
                src={img.url}
                alt={img.time}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                style={{ width:120, height:80, objectFit:'cover', border: i===idx ? '3px solid #2b7' : '1px solid #ccc', cursor:'pointer', flexShrink:0 }}
                onClick={()=>setIdx(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
