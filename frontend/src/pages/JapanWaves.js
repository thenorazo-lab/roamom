import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AdSense from '../components/AdSense';

export default function JapanWaves(){
  const defaultDate = new Date().toISOString().slice(0,10);
  const [idx, setIdx] = useState(0);
  const apiUrl = process.env.REACT_APP_API_URL || '';

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
      const res = await axios.get(`${apiUrl}/api/japan-waves?date=${defaultDate}`);
      const imgs = res.data?.images || [];
      // 상대 경로를 절대 경로로 변환
      const imgsWithAbsoluteUrls = imgs.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${apiUrl}${img.url}`
      }));
      setImages(imgsWithAbsoluteUrls.length > 0 ? imgsWithAbsoluteUrls : buildPlaceholder(defaultDate));
      setIdx(0);
    }catch(e){
      setImages(buildPlaceholder(defaultDate));
      setIdx(0);
    }
  }, [apiUrl, defaultDate]);

  // 처음 진입 시 오늘 날짜로 자동 로드
  useEffect(()=>{ fetchImages(); },[fetchImages]);

  function prev(){ setIdx(i => (i - 1 + images.length) % images.length); }
  function next(){ setIdx(i => (i + 1) % images.length); }

  return (
    <div className="container">
      <h2 className="page-title">일본 파고</h2>
      {images.length===0 ? (
        <p>해당 날짜의 이미지가 없습니다.</p>
      ) : (
        <div style={{maxWidth:800}}>
          <div style={{position:'relative',height:420,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <button onClick={prev} style={{position:'absolute',left:0}}>◀</button>
            <img src={images[idx].url} alt={images[idx].time} style={{maxHeight:380,maxWidth:'100%'}} crossOrigin="anonymous" referrerPolicy="no-referrer" onError={()=>{ setImages(buildPlaceholder(defaultDate)); setIdx(0); }} />
            <button onClick={next} style={{position:'absolute',right:0}}>▶</button>
          </div>
          <div style={{textAlign:'center', fontSize:12, color:'#666', marginTop:4}}>ICOM 일본기상청 데이터</div>
          <div style={{textAlign:'center',marginTop:8}}>{images[idx].time}</div>
          <div style={{display:'flex',gap:8,overflowX:'auto',marginTop:12}}>
            {images.map((img,i)=> (
              <img
                key={i}
                src={img.url}
                alt={img.time}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                style={{ width:120, height:80, objectFit:'cover', border: i===idx ? '3px solid #2b7' : '1px solid #ccc', cursor:'pointer' }}
                onClick={()=>setIdx(i)}
              />
            ))}
          </div>
        </div>
      )}
      <AdSense slot="3456789012" style={{ display: 'block', margin: '20px auto', maxWidth: '800px' }} />
      <div style={{textAlign:'center', marginTop:24}}>
        <Link to="/" className="nav-button">🏠 홈으로</Link>
      </div>
    </div>
  );
}
