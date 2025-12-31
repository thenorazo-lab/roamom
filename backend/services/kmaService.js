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

// 바다누리 실시간 해양관측 데이터 (부이 관측소)
async function getOceanObservation(obsCode) {
  try {
    // 부이 관측소 API 사용
    const url = 'http://www.khoa.go.kr/api/oceangrid/buObsRecent/search.do';
    const res = await axios.get(url, { 
      params: {
        ServiceKey: KHOA_API_KEY,
        ObsCode: obsCode,
        ResultType: 'json'
      },
      timeout: 5000
    });

    const data = res.data?.result?.data;
    if (data) {
      return {
        water_temp: data.water_temp || data.Salinity,
        wave_height: data.wave_height,
        current_speed: data.current_speed
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
