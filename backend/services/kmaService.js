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

// 바다누리 실시간 해양관측 데이터 (조석 관측소)
async function getOceanObservation(obsCode) {
  try {
    // 조석 관측소 최근 데이터 (수온 포함)
    const url = 'http://www.khoa.go.kr/api/oceangrid/tideObsRecent/search.do';
    const res = await axios.get(url, { 
      params: {
        ServiceKey: KHOA_API_KEY,
        ObsCode: obsCode,
        ResultType: 'json'
      },
      timeout: 5000
    });

    const data = res.data?.result?.data;
    if (data && data.water_temp) {
      return {
        water_temp: data.water_temp,
        wave_height: data.wave_height || '0.5', // 조석 관측소는 파고 없을 수 있음
        current_speed: data.current_speed || '0.3',
        air_temp: data.air_temp,
        wind_speed: data.wind_speed
      };
    }
    return null;
  } catch (e) {
    console.error('[kmaService] getOceanObservation error:', e.message);
    return null;
  }
}

module.exports = {
  getVilageFcst,
  getOceanObservation
};
