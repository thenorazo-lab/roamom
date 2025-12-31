// services/kmaService.js
const axios = require('axios');
const API_KEY = process.env.DATA_GO_KR_API_KEY;
const KHOA_API_KEY = process.env.KHOA_API_KEY;

async function getVilageFcst({ nx, ny, base_date, base_time }) {
  const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
  const res = await axios.get(url, { params: {
    ServiceKey: API_KEY,
    pageNo: 1,
    numOfRows: 200,
    dataType: 'JSON',
    base_date,
    base_time,
    nx,
    ny
  }});

  return res.data?.response?.body?.items?.item || null;
}

// 조위관측소 실측 수온 데이터 (공공데이터포털)
async function getOceanObservation(obsCode) {
  try {
    // 조위관측소 실측 수온 조회 API (2025-12-31 승인)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const url = 'http://apis.data.go.kr/1192136/surveyWaterTemp/GetSurveyWaterTempApiService';
    const res = await axios.get(url, { 
      params: {
        serviceKey: KHOA_API_KEY,  // 소문자
        obsCode: obsCode,           // 소문자
        date: dateStr,              // 소문자
        resultType: 'json'          // 소문자
      },
      timeout: 5000
    });

    // API 응답 구조: <wtem>5.6</wtem>, <obsrvnDt>2025-12-31 00:00:00</obsrvnDt>
    const items = res.data?.response?.body?.items?.item;
    if (items && items.length > 0) {
      // 가장 최근 데이터 사용 (totalCount 919개 중 마지막)
      const latestData = Array.isArray(items) ? items[items.length - 1] : items;
      
      return {
        water_temp: latestData.wtem,              // 수온 (°C)
        obs_time: latestData.obsrvnDt,           // 관측일시
        station_name: latestData.obsvtrNm,       // 관측소명
        latitude: latestData.lat,                // 위도
        longitude: latestData.lot                // 경도
      };
    }
    return null;
  } catch (e) {
    console.error('[kmaService] getOceanObservation error:', e.message);
    if (e.response) {
      console.error('[kmaService] API response:', e.response.status, e.response.data);
    }
    return null;
  }
}

module.exports = {
  getVilageFcst,
  getOceanObservation
};
