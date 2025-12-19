import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function JapanWaves(){
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [images, setImages] = useState([]);
  const [idx, setIdx] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ fetchImages(); },[date]);

  async function fetchImages(){
    try{
      const res = await axios.get(`/api/japan-waves?date=${date}`);
      setImages(res.data.images || []);
      setIdx(0);
    }catch(e){ setImages([]); }
  }

  function prev(){ setIdx(i => (i - 1 + images.length) % images.length); }
  function next(){ setIdx(i => (i + 1) % images.length); }

  return (
    <div className="container">
      <h2 className="page-title">일본 파고 (타임시리즈)</h2>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        <label>날짜: <input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
        <button onClick={fetchImages}>조회</button>
      </div>

      {images.length===0 ? (
        <p>해당 날짜의 이미지가 없습니다.</p>
      ) : (
        <div style={{maxWidth:800}}>
          <div style={{position:'relative',height:420,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <button onClick={prev} style={{position:'absolute',left:0}}>◀</button>
            <img src={images[idx].url} alt={images[idx].time} style={{maxHeight:380,maxWidth:'100%'}} />
            <button onClick={next} style={{position:'absolute',right:0}}>▶</button>
          </div>
          <div style={{textAlign:'center',marginTop:8}}>{images[idx].time}</div>
          <div style={{display:'flex',gap:8,overflowX:'auto',marginTop:12}}>
            {images.map((img,i)=> (
              <img key={i} src={img.url} alt={img.time} style={{width:120,height:80,objectFit:'cover',border:i===idx? '3px solid #2b7' : '1px solid #ccc',cursor:'pointer'}} onClick={()=>setIdx(i)} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
