import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AdSense from '../components/AdSense';

const API_BASE_URL = 'http://localhost:3002';

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
      let imgs = res.data?.images || [];
      // 상대 경로를 절대 경로로 변환
      imgs = imgs.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${API_BASE_URL}${img.url}`
      }));
      // 시간 기준 오름차순 정렬
      imgs.sort((a, b) => {
        // img.time: '2026-01-16 03:00' 형태
        if (!a.time || !b.time) return 0;
        return new Date(a.time) - new Date(b.time);
      });
      setImages(imgs.length > 0 ? imgs : buildPlaceholder(defaultDate));
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

  // 이미지 원본 텍스트에서 날짜/시간을 그대로 파싱, 한자만 한글로 변환
  function formatJpWaveTime(rawText) {
    // 예시: '南日本 沿岸波浪予想（気象庁提供） 2026年1月16日(金)3時(JST) 更新'
    // 날짜/시간 부분만 추출: 2026年1月16日(金)3時(JST)
    if (!rawText) return '';
    const match = rawText.match(/\d{4}年\d{1,2}月\d{1,2}日\(.+?\)\d{1,2}時\(JST\)/);
    if (!match) return '';
    let txt = match[0];
    // 한자 → 한글 치환
    txt = txt.replace(/年/g, '년').replace(/月/g, '월').replace(/日/g, '일');
    txt = txt.replace(/時/g, '시');
    // 요일 치환
    txt = txt.replace(/\(日\)/g, '(일)').replace(/\(月\)/g, '(월)').replace(/\(火\)/g, '(화)');
    txt = txt.replace(/\(水\)/g, '(수)').replace(/\(木\)/g, '(목)').replace(/\(金\)/g, '(금)');
    txt = txt.replace(/\(土\)/g, '(토)');
    return txt;
  }

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
          {/* 이미지 원본 텍스트에서 날짜/시간 추출 후 한자→한글 변환 */}
          <div style={{textAlign:'center',marginTop:8}}>
            {images[idx].rawText ? formatJpWaveTime(images[idx].rawText) : ''}
          </div>
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
