// frontend/src/pages/DiaryPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import AdSense from '../components/AdSense';

const DiaryPage = () => {
  const [markers, setMarkers] = useState([]); // 모든 일기
  const [selectedLocation, setSelectedLocation] = useState(null); // 선택된 위치
  const [locationDiaries, setLocationDiaries] = useState([]); // 선택된 위치의 일기 목록
  const [showPreview, setShowPreview] = useState(false); // 미리보기 팝업
  const [showForm, setShowForm] = useState(false); // 작성/수정 폼
  const [selectedDiary, setSelectedDiary] = useState(null); // 현재 보고 있는 일기
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    weather: '',
    waterTemp: '',
    visibility: '',
    catch: '',
    notes: '',
    photos: [] // 사진 배열 (base64)
  });
  const [editMode, setEditMode] = useState(false);

  // 로컬 스토리지에서 일기 불러오기
  useEffect(() => {
    const savedDiaries = localStorage.getItem('harujil_diaries');
    if (savedDiaries) {
      try {
        const diaries = JSON.parse(savedDiaries);
        setMarkers(diaries);
      } catch (e) {
        console.error('일기 불러오기 실패:', e);
      }
    }
  }, []);

  // 로컬 스토리지에 일기 저장
  const saveDiaries = (diaries) => {
    localStorage.setItem('harujil_diaries', JSON.stringify(diaries));
  };

  // 두 좌표가 같은 위치인지 확인 (50m 이내)
  const isSameLocation = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // 지구 반지름 (m)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance < 50; // 50m 이내
  };

  // locationId 생성 (같은 위치끼리 그룹핑)
  const getLocationId = (lat, lng) => {
    return `${lat.toFixed(4)}_${lng.toFixed(4)}`; // 소수점 4자리로 그룹핑
  };

  // 지도 클릭 핸들러 (새 일기 작성)
  const handleMapClick = (latlng) => {
    const locationId = getLocationId(latlng.lat, latlng.lng);
    
    setSelectedLocation({ lat: latlng.lat, lng: latlng.lng, locationId });
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      weather: '',
      waterTemp: '',
      visibility: '',
      catch: '',
      notes: '',
      photos: []
    });
    setEditMode(false);
    setSelectedDiary(null);
    setShowForm(true);
  };

  // 마커 클릭 핸들러 (해당 위치의 일기 목록 미리보기)
  const handleMarkerClick = (marker) => {
    // 해당 위치의 모든 일기 찾기
    const diariesAtLocation = markers.filter(m => 
      isSameLocation(m.lat, m.lng, marker.lat, marker.lng)
    );

    setSelectedLocation({ lat: marker.lat, lng: marker.lng, locationId: marker.locationId });
    setLocationDiaries(diariesAtLocation);
    setShowPreview(true);
  };

  // 사진 추가 (HTML5 File Input 사용, 이미지 압축)
  const handleAddPhoto = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 추가할 수 있습니다.');
      return;
    }

    try {
      // 이미지 압축 및 Base64 변환
      const compressedBase64 = await compressImage(file);
      setFormData({
        ...formData,
        photos: [...formData.photos, compressedBase64]
      });
    } catch (error) {
      console.error('사진 처리 실패:', error);
      alert('사진을 처리하지 못했습니다.');
    }
    
    // input 초기화 (같은 파일 재선택 가능)
    e.target.value = '';
  };

  // 이미지 압축 함수
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 최대 크기 1920px로 제한
          const maxSize = 1920;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // JPEG 품질 0.7로 압축
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 사진 삭제
  const handleRemovePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
  };

  // 미리보기에서 일기 선택
  const handleSelectDiary = (diary) => {
    setSelectedDiary(diary);
    setFormData({
      title: diary.title || '',
      date: diary.date || new Date().toISOString().split('T')[0],
      weather: diary.weather || '',
      waterTemp: diary.waterTemp || '',
      visibility: diary.visibility || '',
      catch: diary.catch || '',
      notes: diary.notes || '',
      photos: diary.photos || []
    });
    setEditMode(false);
    setShowPreview(false);
    setShowForm(true);
  };

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const locationId = getLocationId(selectedLocation.lat, selectedLocation.lng);

    const newDiary = {
      id: editMode && selectedDiary ? selectedDiary.id : Date.now(),
      locationId: locationId,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      ...formData,
      createdAt: editMode && selectedDiary ? selectedDiary.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedDiaries;
    if (editMode && selectedDiary) {
      updatedDiaries = markers.map(m => m.id === selectedDiary.id ? newDiary : m);
    } else {
      updatedDiaries = [...markers, newDiary];
    }

    setMarkers(updatedDiaries);
    saveDiaries(updatedDiaries);
    setShowForm(false);
    setSelectedLocation(null);
    setSelectedDiary(null);

    alert(editMode ? '일기가 수정되었습니다!' : '일기가 저장되었습니다!');
  };

  // 일기 삭제
  const handleDelete = () => {
    if (!window.confirm('이 일기를 삭제하시겠습니까?')) {
      return;
    }

    const updatedDiaries = markers.filter(m => m.id !== selectedDiary.id);
    setMarkers(updatedDiaries);
    saveDiaries(updatedDiaries);
    setShowForm(false);
    setSelectedLocation(null);
    setSelectedDiary(null);

    alert('일기가 삭제되었습니다.');
  };

  // 마커 데이터 (locationId별로 하나의 마커만 표시)
  const uniqueMarkers = [];
  const locationIds = new Set();
  
  markers.forEach(m => {
    if (!locationIds.has(m.locationId || getLocationId(m.lat, m.lng))) {
      locationIds.add(m.locationId || getLocationId(m.lat, m.lng));
      const diariesCount = markers.filter(d => 
        isSameLocation(d.lat, d.lng, m.lat, m.lng)
      ).length;
      
      uniqueMarkers.push({
        id: m.locationId || getLocationId(m.lat, m.lng),
        lat: m.lat,
        lng: m.lng,
        title: `${diariesCount}개의 일기`,
        locationId: m.locationId || getLocationId(m.lat, m.lng)
      });
    }
  });

  return (
    <div className="container">
      <AdSense slot="9012345678" format="horizontal" style={{ display: 'block', width: '100%', height: '90px', margin: '10px 0' }} />

      <h2 className="page-title">📔 해루질 일기</h2>

      <div style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'center' }}>
        <Link to="/" className="nav-button">🏠 홈으로</Link>
      </div>

      <p style={{
        marginBottom: '20px',
        fontSize: '14px',
        color: '#666',
        background: '#f0f8ff',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        🗺️ 지도를 눌러 핀을 꽂고 그날의 상황, 조과 등을 작성해보세요<br/>
        <span style={{ fontSize: '12px', color: '#888' }}>(공유 되지않음 - 내 기기에만 저장됩니다)</span>
      </p>

      {/* 저장된 일기 개수 표시 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '15px',
        fontSize: '14px',
        color: '#0077be',
        fontWeight: 'bold'
      }}>
        📝 저장된 일기: {markers.length}개 ({uniqueMarkers.length}개 장소)
      </div>

      {/* 지도 */}
      <MapComponent
        markers={uniqueMarkers}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        mapHeight="500px"
      />

      {/* 미리보기 팝업 (해당 위치의 일기 목록) */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0077be' }}>
              📍 이 장소의 일기 ({locationDiaries.length}개)
            </h3>

            <div style={{ marginBottom: '20px' }}>
              {locationDiaries.map((diary, index) => (
                <div
                  key={diary.id}
                  onClick={() => handleSelectDiary(diary)}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0077be'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ color: '#333' }}>{diary.title}</strong>
                    <span style={{ fontSize: '12px', color: '#888' }}>{diary.date}</span>
                  </div>

                  {/* 사진 미리보기 */}
                  {diary.photos && diary.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', overflowX: 'auto' }}>
                      {diary.photos.slice(0, 3).map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`사진 ${idx + 1}`}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ))}
                      {diary.photos.length > 3 && (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f0f0f0',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          +{diary.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                    {diary.weather && `☀️ ${diary.weather}`}
                    {diary.waterTemp && ` / 🌡️ ${diary.waterTemp}`}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {diary.catch && `🐟 ${diary.catch}`}
                  </div>
                  {diary.notes && (
                    <div style={{
                      fontSize: '12px',
                      color: '#999',
                      marginTop: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {diary.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setShowForm(true);
                  setFormData({
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    weather: '',
                    waterTemp: '',
                    visibility: '',
                    catch: '',
                    notes: '',
                    photos: []
                  });
                  setEditMode(false);
                  setSelectedDiary(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '6px',
                  background: '#0077be',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✏️ 새 일기 작성
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setLocationDiaries([]);
                  setSelectedLocation(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '6px',
                  background: '#eee',
                  color: '#333',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일기 작성/수정 폼 */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '20px',
          paddingTop: '40px',
          paddingBottom: '120px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            paddingBottom: '80px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: 'calc(100vh - 160px)',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            marginBottom: '40px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0077be' }}>
              {selectedDiary && !editMode ? '📖 일기 보기' : editMode ? '📝 일기 수정' : '✏️ 새 일기 작성'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  📍 위치
                </label>
                <input
                  type="text"
                  value={`${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: '#f5f5f5',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  제목 <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 부산 앞바다 해루질"
                  required
                  disabled={selectedDiary && !editMode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: (selectedDiary && !editMode) ? '#f5f5f5' : 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  날짜
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  disabled={selectedDiary && !editMode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: (selectedDiary && !editMode) ? '#f5f5f5' : 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  날씨
                </label>
                <input
                  type="text"
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  placeholder="예: 맑음, 기온 25°C"
                  disabled={selectedDiary && !editMode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: (selectedDiary && !editMode) ? '#f5f5f5' : 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  수온
                </label>
                <input
                  type="text"
                  value={formData.waterTemp}
                  onChange={(e) => setFormData({ ...formData, waterTemp: e.target.value })}
                  placeholder="예: 18°C"
                  disabled={selectedDiary && !editMode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: (selectedDiary && !editMode) ? '#f5f5f5' : 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  시야/파고
                </label>
                <input
                  type="text"
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  placeholder="예: 시야 좋음, 파고 0.5m"
                  disabled={selectedDiary && !editMode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: (selectedDiary && !editMode) ? '#f5f5f5' : 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  조과 (잡은 것)
                </label>
                <input
                  type="text"
                  value={formData.catch}
                  onChange={(e) => setFormData({ ...formData, catch: e.target.value })}
                  placeholder="예: 소라 3kg, 전복 10개"
                  disabled={selectedDiary && !editMode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: (selectedDiary && !editMode) ? '#f5f5f5' : 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  메모
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="그날의 상황, 특이사항 등을 자유롭게 작성하세요..."
                  rows={5}
                  disabled={selectedDiary && !editMode}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    background: (selectedDiary && !editMode) ? '#f5f5f5' : 'white',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* 사진 섹션 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  📷 사진 ({formData.photos.length})
                </label>
                
                {/* 사진 목록 */}
                {formData.photos.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    {formData.photos.map((photo, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          src={photo}
                          alt={`사진 ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #ddd'
                          }}
                        />
                        {(!selectedDiary || editMode) && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(255,0,0,0.8)',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '16px',
                              lineHeight: '24px',
                              padding: 0
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 사진 추가 버튼 */}
                {(!selectedDiary || editMode) && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* 갤러리에서 선택 */}
                    <input
                      type="file"
                      accept="image/*"
                      id="photo-gallery"
                      onChange={handleAddPhoto}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="photo-gallery"
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '14px',
                        borderRadius: '6px',
                        background: '#f0f0f0',
                        color: '#333',
                        border: '1px dashed #999',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'block'
                      }}
                    >
                      📷 갤러리
                    </label>

                    {/* 카메라로 촬영 */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id="photo-camera"
                      onChange={handleAddPhoto}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="photo-camera"
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '14px',
                        borderRadius: '6px',
                        background: '#e3f2fd',
                        color: '#333',
                        border: '1px dashed #64b5f6',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'block'
                      }}
                    >
                      📸 촬영
                    </label>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {/* 읽기 모드일 때 편집 버튼 표시 */}
                {selectedDiary && !editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '16px',
                        borderRadius: '6px',
                        background: '#0077be',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ✏️ 편집
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedLocation(null);
                        setSelectedDiary(null);
                        setEditMode(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '16px',
                        borderRadius: '6px',
                        background: '#eee',
                        color: '#333',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      닫기
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '16px',
                        borderRadius: '6px',
                        background: '#0077be',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {editMode ? '수정' : '저장'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedLocation(null);
                        setSelectedDiary(null);
                        setEditMode(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '16px',
                        borderRadius: '6px',
                        background: '#eee',
                        color: '#333',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                  </>
                )}
              </div>

              {selectedDiary && editMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '10px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ 삭제
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      <AdSense slot="0123456789" style={{ display: 'block', margin: '20px auto' }} />
    </div>
  );
};

export default DiaryPage;
