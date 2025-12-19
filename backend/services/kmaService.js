// services/kmaService.js
const axios = require('axios');
const API_KEY = process.env.DATA_GO_KR_API_KEY;

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

module.exports = {
  getVilageFcst
};
