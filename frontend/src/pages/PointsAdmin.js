import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export default function PointsAdmin(){
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [points, setPoints] = useState([]);
  const [form, setForm] = useState({title:'',lat:'',lng:'',image:'',desc:'',url:''});
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const baseUrl = process.env.REACT_APP_API_URL || '/api';

  function isValidPoint(data){
    return data.title && !isNaN(parseFloat(data.lat)) && !isNaN(parseFloat(data.lng));
  }

  useEffect(()=>{ fetchPoints(); },[fetchPoints]);

  const fetchPoints = useCallback(async () => {
    const res = await axios.get(baseUrl + '/points');
    setPoints(res.data);
  }, [baseUrl]);

  function authHeaders(){ return password ? { 'x-admin-password': password } : {}; }

  async function doAuth(){
    // simple: try to create a temp point and delete it to validate
    try {
      const r = await axios.post(baseUrl + '/points', { title:'auth-test', lat:0, lng:0 }, { headers: authHeaders() });
      await axios.delete(baseUrl + '/points/' + r.data.id, { headers: authHeaders() });
      setAuthed(true);
      fetchPoints();
    } catch(e){
      alert('인증 실패: 비밀번호가 틀렸습니다');
    }
  }

  async function createPoint(){
    if(!isValidPoint(form)){ alert('제목, 위도, 경도는 필수입니다.'); return; }
    try{
      // if there's a selected file, upload it first
      if(form._file){
        const fd = new FormData();
        fd.append('image', form._file);
        setUploading(true);
        const up = await axios.post(baseUrl + '/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() } });
        form.image = up.data.url;
        setUploading(false);
      }
      await axios.post(baseUrl + '/points', { title: form.title, lat: form.lat, lng: form.lng, image: form.image, desc: form.desc, url: form.url }, { headers: authHeaders() });
      setForm({title:'',lat:'',lng:'',image:'',desc:'',url:'', _file: null});
      fetchPoints();
    }catch(e){ setUploading(false); alert('생성 실패'); }
  }

  async function enableEdit(p){
    setEditingId(p.id);
    setForm({ title: p.title, lat: p.lat, lng: p.lng, image: p.image, desc: p.desc, url: p.url || '' });
  }

  async function updatePoint(p){
    if(!isValidPoint(form)){ alert('제목, 위도, 경도는 필수입니다.'); return; }
    try{ await axios.put(baseUrl + '/points/' + p.id, form, { headers: authHeaders() }); setEditingId(null); setForm({title:'',lat:'',lng:'',image:'',desc:'',url:''}); fetchPoints(); }catch(e){ alert('수정 실패'); }
  }

  async function deletePoint(p){ if(!window.confirm('정말 삭제?')) return; try{ await axios.delete(baseUrl + '/points/' + p.id, { headers: authHeaders() }); fetchPoints(); }catch(e){ alert('삭제 실패'); } }

  return (
    <div style={{padding:20}}>
      <h2>포인트 관리자</h2>
      {!authed ? (
        <div>
          <label>관리자 비밀번호: <input value={password} onChange={e=>setPassword(e.target.value)} type="password" /></label>
          <button onClick={doAuth}>로그인</button>
        </div>
      ):( 
        <div>
          <h3>새 포인트 추가</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,maxWidth:800}}>
            <input placeholder="title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            <input placeholder="lat" value={form.lat} onChange={e=>setForm({...form,lat:e.target.value})} />
            <input placeholder="lng" value={form.lng} onChange={e=>setForm({...form,lng:e.target.value})} />
            <input type="file" accept="image/*" onChange={e=>setForm({...form,_file:e.target.files[0]})} style={{gridColumn:'1 / -1'}} />
            <input placeholder="desc" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} style={{gridColumn:'1 / -1'}} />
            <input placeholder="블로그 URL (선택)" value={form.url} onChange={e=>setForm({...form,url:e.target.value})} style={{gridColumn:'1 / -1'}} />
            <div style={{display:'flex',gap:8}}>
              <button onClick={createPoint} disabled={!isValidPoint(form) || uploading}>{uploading ? '업로드 중...' : '추가'}</button>
              <button onClick={()=>setForm({title:'',lat:'',lng:'',image:'',desc:'',url:'',_file:null})}>초기화</button>
            </div>
            {form._file && (
              <div style={{gridColumn:'1 / -1'}}>
                <strong>선택한 이미지 미리보기:</strong>
                <div><img src={URL.createObjectURL(form._file)} alt="preview" style={{width:160,height:100,objectFit:'cover'}} /></div>
              </div>
            )}
          </div>

          <h3>기존 포인트</h3>
          <ul>
            {points.map(p=> (
              <li key={p.id} style={{marginBottom:10}}>
                {!editingId || editingId !== p.id ? (
                  <>
                    <strong>{p.title}</strong> ({p.lat}, {p.lng}) <br />
                    {p.image && <img src={p.image} alt={p.title} style={{width:120,height:80,objectFit:'cover'}} />}
                    <div>
                      <button onClick={()=>enableEdit(p)}>편집</button>
                      <button onClick={()=>deletePoint(p)}>삭제</button>
                    </div>
                  </>
                ) : (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
                    <input value={form.lat} onChange={e=>setForm({...form,lat:e.target.value})} />
                    <input value={form.lng} onChange={e=>setForm({...form,lng:e.target.value})} />
                    <input value={form.image} onChange={e=>setForm({...form,image:e.target.value})} />
                    <input type="file" accept="image/*" onChange={e=>setForm({...form,_file:e.target.files[0]})} />
                    <input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} />
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>updatePoint(p)}>저장</button>
                      <button onClick={()=>{ setEditingId(null); setForm({title:'',lat:'',lng:'',image:'',desc:''}); }}>취소</button>
                    </div>
                    {form._file && (
                      <div style={{gridColumn:'1 / -1'}}>
                        <strong>선택한 이미지 미리보기:</strong>
                        <div><img src={URL.createObjectURL(form._file)} alt="preview" style={{width:160,height:100,objectFit:'cover'}} /></div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
