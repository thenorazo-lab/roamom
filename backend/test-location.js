// 특정 좌표의 부이 데이터 테스트
require('dotenv').config();
const axios = require('axios');

async function testLocation(lat, lon) {
  try {
    console.log(`테스트 좌표: ${lat}, ${lon}\n`);
    
    const res = await axios.get('http://localhost:3002/api/sea-info', {
      params: { lat, lon },
      timeout: 30000
    });
    
    console.log('응답 상태:', res.status);
    console.log('\n=== 결과 ===');
    console.log('nearestObs:', res.data.nearestObs?.name);
    console.log('buoy:', res.data.buoy ? '있음' : 'null');
    console.log('buoyError:', res.data.buoyError);
    
    if (res.data.buoy) {
      console.log('\n부이 데이터:');
      console.log(JSON.stringify(res.data.buoy, null, 2));
    }
    
  } catch (e) {
    console.error('에러:', e.message);
  }
}

// 사용자가 보고한 좌표
testLocation(37.01466506047317, 126.59436036832632);
