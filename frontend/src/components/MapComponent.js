import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// CDN 아이콘을 직접 사용하여 기본 아이콘 문제를 회피합니다.
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map 클릭 후 핀을 추가하고 위치를 부모로 알리는 훅
function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
}

export default function MapComponent({ center = [36, 128], zoom = 7, markers = [], onMapClick }) {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current) {
      // 추가 작업 가능
    }
  }, []);

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={zoom} style={{ height: '60vh', width: '100%' }} ref={mapRef}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onClick={(latlng) => onMapClick && onMapClick(latlng)} />

        {markers.map((m) => (
          <Marker key={m.id || `${m.lat}-${m.lng}`} position={[m.lat, m.lng]} eventHandlers={{ click: ()=>{ fetch('/api/points/click',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ pointId: m.id })}).catch(()=>{});} }}>
            <Popup>
              <strong>{m.title || m.id}</strong>
              <div>{m.desc}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
