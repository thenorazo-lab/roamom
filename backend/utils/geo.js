// utils/geo.js
// 지리/좌표 관련 유틸리티

const tideObservatories = [
    { "code": "DT_0001", "name": "안흥", "lat": 36.6333, "lon": 126.15 },
    { "code": "DT_0012", "name": "대천", "lat": 36.3167, "lon": 126.5 },
    { "code": "DT_0031", "name": "인천", "lat": 37.45, "lon": 126.6167 },
    { "code": "DT_0055", "name": "평택", "lat": 36.9833, "lon": 126.8 },
    { "code": "DT_0069", "name": "안산", "lat": 37.1667, "lon": 126.5833 },
    { "code": "DT_0004", "name": "군산", "lat": 35.9833, "lon": 126.5833 },
    { "code": "DT_0005", "name": "목포", "lat": 34.7833, "lon": 126.3667 },
    { "code": "DT_0002", "name": "부산", "lat": 35.1000, "lon": 129.0500 },
    { "code": "DT_0003", "name": "여수", "lat": 34.7500, "lon": 127.7500 },
    { "code": "DT_0010", "name": "속초", "lat": 38.2167, "lon": 128.5833 },
    { "code": "DT_0011", "name": "강릉", "lat": 37.7500, "lon": 128.9833 },
    { "code": "DT_0013", "name": "제주", "lat": 33.5000, "lon": 126.5167 },
    { "code": "DT_0014", "name": "서귀포", "lat": 33.2500, "lon": 126.5667 },
    { "code": "DT_0015", "name": "완도", "lat": 34.3167, "lon": 126.7500 },
    { "code": "DT_0016", "name": "통영", "lat": 34.8500, "lon": 128.4167 },
    { "code": "DT_0017", "name": "거제", "lat": 34.8833, "lon": 128.6833 },
    { "code": "DT_0018", "name": "고성", "lat": 34.9667, "lon": 128.3333 }
];

// 격자 변환 (기상청 DFS 좌표계)
function dfs_xy_conv(code, v1, v2) {
    const RE = 6371.00877;
    const GRID = 5.0;
    const SLAT1 = 30.0;
    const SLAT2 = 60.0;
    const OLON = 126.0;
    const OLAT = 38.0;
    const XO = 43;
    const YO = 136;

    const DEGRAD = Math.PI / 180.0;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = (re * sf) / Math.pow(ro, sn);

    let ra = Math.tan(Math.PI * 0.25 + v1 * DEGRAD * 0.5);
    ra = (re * sf) / Math.pow(ra, sn);
    let theta = v2 * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    const rs = {};
    rs.x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    rs.y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return rs;
}

// Haversine 거리 계산
function getDistance(lat1, lon1, lat2, lon2) {
    function deg2rad(deg) { return deg * (Math.PI/180); }
    const R = 6371;
    const dLat = deg2rad(lat2-lat1);
    const dLon = deg2rad(lon2-lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // km
}

function findClosestObs(lat, lon) {
    return tideObservatories.reduce((prev, curr) => {
        return getDistance(lat, lon, prev.lat, prev.lon) < getDistance(lat, lon, curr.lat, curr.lon) ? prev : curr;
    });
}

module.exports = {
    tideObservatories,
    dfs_xy_conv,
    getDistance,
    findClosestObs
};
