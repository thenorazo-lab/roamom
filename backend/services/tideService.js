// services/tideService.js
const axios = require('axios');
const KHOA_API_KEY = process.env.KHOA_API_KEY;

async function getTide(obsCode, date) {
  const url = 'http://www.khoa.go.kr/api/oceangrid/tideObs/search.do';
  const res = await axios.get(url, { params: {
    ServiceKey: KHOA_API_KEY,
    ObsCode: obsCode,
    Date: date,
    ResultType: 'json'
  }});

  return res.data || null;
}

module.exports = { getTide };
