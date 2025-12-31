// backend/utils.js

// 조석 관측소 목록 (공공데이터포털 API 코드 - 전체)
const tideObservatories = [
    { "code": "DT_0001", "name": "인천", "lat": 37.45, "lon": 126.6167 },
    { "code": "DT_0002", "name": "평택", "lat": 36.9833, "lon": 126.8 },
    { "code": "DT_0003", "name": "영광", "lat": 35.4167, "lon": 126.4167 },
    { "code": "DT_0004", "name": "제주", "lat": 33.5000, "lon": 126.5167 },
    { "code": "DT_0005", "name": "부산", "lat": 35.1000, "lon": 129.0500 },
    { "code": "DT_0006", "name": "묵호", "lat": 37.55, "lon": 129.1167 },
    { "code": "DT_0007", "name": "목포", "lat": 34.7833, "lon": 126.3667 },
    { "code": "DT_0008", "name": "안산", "lat": 37.1667, "lon": 126.5833 },
    { "code": "DT_0010", "name": "서귀포", "lat": 33.2500, "lon": 126.5667 },
    { "code": "DT_0011", "name": "후포", "lat": 36.6833, "lon": 129.45 },
    { "code": "DT_0012", "name": "속초", "lat": 38.2167, "lon": 128.5833 },
    { "code": "DT_0013", "name": "울릉도", "lat": 37.4833, "lon": 130.9 },
    { "code": "DT_0014", "name": "통영", "lat": 34.8333, "lon": 128.4333 },
    { "code": "DT_0016", "name": "여수", "lat": 34.7500, "lon": 127.7500 },
    { "code": "DT_0017", "name": "대산", "lat": 37.0167, "lon": 126.3667 },
    { "code": "DT_0018", "name": "군산", "lat": 35.9833, "lon": 126.5833 },
    { "code": "DT_0020", "name": "울산", "lat": 35.5000, "lon": 129.3833 },
    { "code": "DT_0021", "name": "추자도", "lat": 33.9583, "lon": 126.3 },
    { "code": "DT_0022", "name": "성산포", "lat": 33.4667, "lon": 126.9283 },
    { "code": "DT_0023", "name": "모슬포", "lat": 33.2167, "lon": 126.25 },
    { "code": "DT_0024", "name": "장항", "lat": 36.0067, "lon": 126.6883 },
    { "code": "DT_0025", "name": "보령", "lat": 36.4067, "lon": 126.4867 },
    { "code": "DT_0026", "name": "고흥발포", "lat": 34.4817, "lon": 127.3383 },
    { "code": "DT_0027", "name": "완도", "lat": 34.3150, "lon": 126.7600 },
    { "code": "DT_0028", "name": "진도", "lat": 34.3767, "lon": 126.3050 },
    { "code": "DT_0029", "name": "거제도", "lat": 34.8000, "lon": 128.7000 },
    { "code": "DT_0031", "name": "거문도", "lat": 34.0283, "lon": 127.3083 },
    { "code": "DT_0032", "name": "강화대교", "lat": 37.7167, "lon": 126.4833 },
    { "code": "DT_0035", "name": "흑산도", "lat": 34.6833, "lon": 125.4333 },
    { "code": "DT_0036", "name": "대청도", "lat": 37.8167, "lon": 124.7167 },
    { "code": "DT_0037", "name": "어청도", "lat": 36.1167, "lon": 125.9833 },
    { "code": "DT_0038", "name": "굴업도", "lat": 37.1833, "lon": 126.0167 },
    { "code": "DT_0039", "name": "왕돌초", "lat": 37.2333, "lon": 129.3667 },
    { "code": "DT_0040", "name": "독도", "lat": 37.2417, "lon": 131.8667 },
    { "code": "DT_0041", "name": "복사초", "lat": 34.7667, "lon": 125.6167 },
    { "code": "DT_0042", "name": "교본초", "lat": 34.7167, "lon": 125.7333 },
    { "code": "DT_0043", "name": "영흥도", "lat": 37.2333, "lon": 126.4167 },
    { "code": "DT_0044", "name": "영종대교", "lat": 37.5167, "lon": 126.5667 },
    { "code": "DT_0046", "name": "쌍정초", "lat": 34.9, "lon": 125.8333 },
    { "code": "DT_0047", "name": "도농탄", "lat": 35.6167, "lon": 126.5 },
    { "code": "DT_0048", "name": "속초등표", "lat": 38.2333, "lon": 128.6 },
    { "code": "DT_0049", "name": "광양", "lat": 34.9167, "lon": 127.7 },
    { "code": "DT_0050", "name": "태안", "lat": 36.9, "lon": 126.2333 },
    { "code": "DT_0051", "name": "서천마량", "lat": 36.0333, "lon": 126.5333 },
    { "code": "DT_0052", "name": "인천송도", "lat": 37.3833, "lon": 126.6333 },
    { "code": "DT_0054", "name": "진해", "lat": 35.15, "lon": 128.7 },
    { "code": "DT_0056", "name": "부산항신항", "lat": 35.0833, "lon": 128.8167 },
    { "code": "DT_0057", "name": "동해항", "lat": 37.5, "lon": 129.15 },
    { "code": "DT_0058", "name": "경인항", "lat": 37.4667, "lon": 126.6 },
    { "code": "DT_0059", "name": "백령도", "lat": 37.9667, "lon": 124.7167 },
    { "code": "DT_0060", "name": "연평도", "lat": 37.65, "lon": 125.7 },
    { "code": "DT_0061", "name": "삼천포", "lat": 34.9333, "lon": 128.0667 },
    { "code": "DT_0062", "name": "마산", "lat": 35.1833, "lon": 128.5667 },
    { "code": "DT_0063", "name": "가덕도", "lat": 35.0167, "lon": 128.8167 },
    { "code": "DT_0064", "name": "교동대교", "lat": 37.8167, "lon": 126.3 },
    { "code": "DT_0065", "name": "덕적도", "lat": 37.2167, "lon": 126.1667 },
    { "code": "DT_0067", "name": "안흥", "lat": 36.6333, "lon": 126.15 },
    { "code": "DT_0068", "name": "위도", "lat": 35.6167, "lon": 126.3 },
    { "code": "DT_0091", "name": "포항", "lat": 36.0333, "lon": 129.3667 },
    { "code": "DT_0092", "name": "여호항", "lat": 34.7, "lon": 127.85 },
    { "code": "DT_0093", "name": "소무의도", "lat": 37.45, "lon": 126.45 },
    { "code": "DT_0094", "name": "서거차도", "lat": 37.45, "lon": 126.5 },
    { "code": "IE_0060", "name": "이어도", "lat": 32.1231, "lon": 125.1822 },
    { "code": "IE_0061", "name": "신안가거초", "lat": 34.0667, "lon": 125.1167 },
    { "code": "IE_0062", "name": "옹진소청초", "lat": 37.4233, "lon": 124.7383 },
    { "code": "SO_0326", "name": "미조항", "lat": 34.7417, "lon": 127.9833 },
    { "code": "SO_0537", "name": "벽파진", "lat": 35.0833, "lon": 126.4167 },
    { "code": "SO_0538", "name": "안마도", "lat": 36.5167, "lon": 126.3333 },
    { "code": "SO_0539", "name": "강화외포", "lat": 37.7333, "lon": 126.3833 },
    { "code": "SO_0540", "name": "호산항", "lat": 34.7167, "lon": 128.3833 },
    { "code": "SO_0553", "name": "해운대", "lat": 35.1586, "lon": 129.16 },
    { "code": "SO_0566", "name": "송공항", "lat": 37.5, "lon": 126.5 },
    { "code": "SO_0699", "name": "천리포항", "lat": 36.8167, "lon": 126.15 },
    { "code": "SO_0733", "name": "강릉항", "lat": 37.7833, "lon": 128.9167 },
    { "code": "SO_0752", "name": "검산항", "lat": 34.45, "lon": 126.45 },
    { "code": "SO_1267", "name": "구룡포항", "lat": 36.0, "lon": 129.55 }
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

// 해양 부이 관측소 목록 (KHOA)
const buoyStations = [
    { "code": "TW_0062", "name": "해운대해수욕장", "lat": 35.14897, "lon": 129.17017 },
    { "code": "TW_0063", "name": "거제도", "lat": 34.76628, "lon": 128.90369 },
    { "code": "TW_0064", "name": "거문도", "lat": 34.02842, "lon": 127.30564 },
    { "code": "TW_0065", "name": "마라도", "lat": 33.08492, "lon": 126.2725 },
    { "code": "TW_0066", "name": "외연도", "lat": 36.24542, "lon": 125.75219 },
    { "code": "TW_0067", "name": "덕적도", "lat": 37.23483, "lon": 126.01439 },
    { "code": "TW_0068", "name": "칠발도", "lat": 34.79361, "lon": 125.77611 },
    { "code": "TW_0069", "name": "동해", "lat": 37.54611, "lon": 129.95139 },
    { "code": "TW_0070", "name": "포항", "lat": 36.35, "lon": 129.78333 },
    { "code": "TW_0071", "name": "울릉도", "lat": 37.45139, "lon": 131.10989 },
    { "code": "TW_0072", "name": "울산", "lat": 35.34369, "lon": 129.84514 }
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
    // 한국 시간(KST = UTC+9)으로 변환
    const now = new Date();
    const kstOffset = 9 * 60; // 분 단위
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstTime = new Date(utc + (kstOffset * 60000));
    
    const year = kstTime.getFullYear();
    const month = ('0' + (kstTime.getMonth() + 1)).slice(-2);
    const day = ('0' + kstTime.getDate()).slice(-2);
    const hours = kstTime.getHours();
    const minutes = kstTime.getMinutes();

    // 기상청 단기예보: 02, 05, 08, 11, 14, 17, 20, 23시 발표 (발표 후 10분 뒤 데이터 사용 가능)
    const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
    let base_time = '2300';
    let base_date = `${year}${month}${day}`;
    
    for (let i = baseTimes.length - 1; i >= 0; i--) {
        const baseHour = parseInt(baseTimes[i].substring(0, 2), 10);
        // 발표 시간 + 10분 이후부터 사용 가능
        if (hours > baseHour || (hours === baseHour && minutes >= 10)) {
            base_time = baseTimes[i];
            break;
        }
    }
    
    // 자정 이전인데 23시 발표를 못 쓰는 경우, 전날 23시 발표 사용
    if (hours === 0 && minutes < 10) {
        const yesterday = new Date(kstTime);
        yesterday.setDate(yesterday.getDate() - 1);
        base_date = `${yesterday.getFullYear()}${('0' + (yesterday.getMonth() + 1)).slice(-2)}${('0' + yesterday.getDate()).slice(-2)}`;
        base_time = '2300';
    }

    return {
        base_date: base_date,
        base_time: base_time,
        search_date: `${year}${month}${day}`
    };
}

module.exports = { tideObservatories, scubaBeaches, buoyStations, dfs_xy_conv, getDistance, findClosest, getApiDateTime };

