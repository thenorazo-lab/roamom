// services/skinScubaService.js
const axios = require('axios');
const API_KEY = process.env.DATA_GO_KR_API_KEY;

async function getSkinScuba(lat, lon) {
  const url = 'http://apis.data.go.kr/1192136/fcstSkinScuba/getSkinScubaFcst';
  try {
    const res = await axios.get(url, { params: {
      ServiceKey: API_KEY,
      lat,
      lon,
      dataType: 'JSON'
    }});
    
    // Extract nested water_temp, wave_height, current_speed from response
    const body = res.data?.response?.body;
    if (body && body.items && body.items.item && body.items.item.length > 0) {
      const item = body.items.item[0]; // latest forecast
      return {
        water_temp: item.waterTemp,
        wave_height: item.waveHeight,
        current_speed: item.currentSpeed
      };
    }
    return null;
  } catch (e) {
    console.error('[skinScubaService]', e.message);
    throw e;
  }
}

module.exports = { getSkinScuba };
