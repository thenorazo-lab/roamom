import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function PointsAdmin(){
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [points, setPoints] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [form, setForm] = useState({title:'',lat:'',lng:'',image:'',desc:'',url:''});
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  function isValidPoint(data){
    return data.title && !isNaN(parseFloat(data.lat)) && !isNaN(parseFloat(data.lng));
  }

  const fetchPoints = useCallback(async () => {
    const res = await axios.get(`${API_BASE_URL}/api/points`);
    setPoints(res.data);
  }, []);

  const fetchInquiries = useCallback(async () => {
    const res = await axios.get(`${API_BASE_URL}/api/inquiries`);
    setInquiries(res.data);
  }, []);

  useEffect(()=>{ fetchPoints(); fetchInquiries(); },[fetchPoints, fetchInquiries]);

  function authHeaders(){ return password ? { 'x-admin-password': password } : {}; }

  async function doAuth(){
    // simple: try to create a temp point and delete it to validate
    try {
      const r = await axios.post(`${API_BASE_URL}/api/points`, { title:'auth-test', lat:0, lng:0 }, { headers: authHeaders() });
      await axios.delete(`${API_BASE_URL}/api/points/${r.data.id}`, { headers: authHeaders() });
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
        const up = await axios.post(`${API_BASE_URL}/api/upload-image`, fd, { headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() } });
        form.image = up.data.url;
        setUploading(false);
      }
      const response = await axios.post(`${API_BASE_URL}/api/points`, { title: form.title, lat: form.lat, lng: form.lng, image: form.image, desc: form.desc, url: form.url }, { headers: authHeaders() });
      console.log('✅ 포인트 저장 성공:', response.data);
      alert(`✅ "${form.title}" 포인트가 서버에 저장되었습니다!`);
      setForm({title:'',lat:'',lng:'',image:'',desc:'',url:'', _file: null});
      await fetchPoints();
    }catch(e){ 
      console.error('❌ 생성 실패:', e);
      setUploading(false); 
      alert('❌ 생성 실패: ' + (e.response?.data?.error || e.message)); 
    }
  }

  async function enableEdit(p){
    setEditingId(p.id);
    setForm({ title: p.title, lat: p.lat, lng: p.lng, image: p.image, desc: p.desc, url: p.url || '' });
  }

  async function updatePoint(p){
    if(!isValidPoint(form)){ alert('제목, 위도, 경도는 필수입니다.'); return; }
    try{ 
      const response = await axios.put(`${API_BASE_URL}/api/points/${p.id}`, form, { headers: authHeaders() }); 
      console.log('✅ 포인트 수정 성공:', response.data);
      alert(`✅ "${form.title}" 포인트가 수정되었습니다!`);
      setEditingId(null); 
      setForm({title:'',lat:'',lng:'',image:'',desc:'',url:''}); 
      await fetchPoints(); 
    }catch(e){ 
      console.error('❌ 수정 실패:', e);
      alert('❌ 수정 실패: ' + (e.response?.data?.error || e.message)); 
    }
  }

  async function deletePoint(p){ 
    if(!window.confirm(`"${p.title}" 포인트를 정말 삭제하시겠습니까?`)) return; 
    try{ 
      await axios.delete(`${API_BASE_URL}/api/points/${p.id}`, { headers: authHeaders() }); 
      console.log('✅ 포인트 삭제 성공:', p.id);
      alert(`✅ "${p.title}" 포인트가 삭제되었습니다.`);
      await fetchPoints(); 
    }catch(e){ 
      console.error('❌ 삭제 실패:', e);
      alert('❌ 삭제 실패: ' + (e.response?.data?.error || e.message)); 
    } 
  }

  async function deleteInquiry(id){ 
    if(!window.confirm('이 문의를 정말 삭제하시겠습니까?')) return; 
    try{ 
      await axios.delete(`${API_BASE_URL}/api/inquiry/${id}`, { headers: authHeaders() }); 
      console.log('✅ 문의 삭제 성공:', id);
      alert('✅ 문의가 삭제되었습니다.');
      await fetchInquiries(); 
    }catch(e){ 
      console.error('❌ 문의 삭제 실패:', e);
      alert('❌ 문의 삭제 실패: ' + (e.response?.data?.error || e.message)); 
    } 
  }

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

          <h3>포인트 제보 목록</h3>
          <ul>
            {inquiries.map(inq => (
              <li key={inq._id} style={{marginBottom:10, border:'1px solid #ccc', padding:10}}>
                <strong>Email:</strong> {inq.email} <br />
                <strong>내용:</strong> {inq.desc} <br />
                <strong>시간:</strong> {new Date(inq.createdAt).toLocaleString('ko-KR')} <br />
                <button onClick={()=>deleteInquiry(inq._id)}>삭제</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
