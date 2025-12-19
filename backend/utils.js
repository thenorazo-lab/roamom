// backend/utils.js

// 조석 관측소 목록 (주요 관측소 예시)
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
    { "code": "DT_0014", "name": "서귀포", "lat": 33.2500, "lon": 126.5667 }
];

// 스킨스쿠버 해수욕장 목록 (API 문서 기반 예시)
const scubaBeaches = [
    { "code": "101", "name": "해운대", "lat": 35.1586, "lon": 129.1600 },
    { "code": "102", "name": "광안리", "lat": 35.1531, "lon": 129.1187 },
    { "code": "201", "name": "대천", "lat": 36.3167, "lon": 126.5 },
    { "code": "202", "name": "만리포", "lat": 36.7869, "lon": 126.1483 },
    { "code": "301", "name": "경포", "lat": 37.8000, "lon": 128.9167 },
    { "code": "302", "name": "속초", "lat": 38.1925, "lon": 128.6058 },
    { "code": "401", "name": "협재", "lat": 33.3936, "lon": 126.2392 },
    { "code": "402", "name": "중문", "lat": 33.2408, "lon": 126.4147 }
];

// 위도, 경도를 기상청 격자 좌표로 변환하는 함수
function dfs_xy_conv(v1, v2) {
    const RE = 6371.00877; // 지구 반경(km)
    const GRID = 5.0; // 격자 간격(km)
    const SLAT1 = 30.0; // 투영 위도1(degree)
    const SLAT2 = 60.0; // 투영 위도2(degree)
    const OLON = 126.0; // 기준점 경도(degree)
    const OLAT = 38.0; // 기준점 위도(degree)
    const XO = 43; // 기준점 X좌표(GRID)
    const YO = 136; // 기준점 Y좌표(GRID)
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

    return {
        x: Math.floor(ra * Math.sin(theta) + XO + 0.5),
        y: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)
    };
}

// 두 지점 간의 거리를 계산하는 함수 (haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// 주어진 위치에서 가장 가까운 지점을 찾는 범용 함수
const findClosest = (lat, lon, locations) => {
    if (!locations || locations.length === 0) return null;
    return locations.reduce((prev, curr) => {
        const prevDist = getDistance(lat, lon, prev.lat, prev.lon);
        const currDist = getDistance(lat, lon, curr.lat, curr.lon);
        return (prevDist < currDist) ? prev : curr;
    });
};

// 오늘 날짜와 현재 시간을 API 형식에 맞게 반환하는 함수
const getApiDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const hours = now.getHours();

    const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
    let base_time = '2300';
    for (let i = baseTimes.length - 1; i >= 0; i--) {
        if (hours >= parseInt(baseTimes[i].substring(0, 2), 10)) {
            base_time = baseTimes[i];
            break;
        }
    }

    return {
        base_date: `${year}${month}${day}`,
        base_time: base_time,
        search_date: `${year}${month}${day}`
    };
}

module.exports = { tideObservatories, scubaBeaches, dfs_xy_conv, getDistance, findClosest, getApiDateTime };

