// 간단한 부이 API 테스트
require('dotenv').config();
const axios = require('axios');
const xml2js = require('xml2js');

async function testBuoy() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  console.log('날짜:', dateStr);
  console.log('DATA_GO_KR_API_KEY:', process.env.DATA_GO_KR_API_KEY ? '설정됨' : '없음');
  
  try {
    // 명세대로: reqDate 파라미터 사용
    console.log('\n[테스트] reqDate 파라미터 사용 (API 명세)');
    let res = await axios.get('https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService', {
      params: {
        serviceKey: process.env.DATA_GO_KR_API_KEY,
        obsCode: 'TW_0062', // 해운대해수욕장
        reqDate: dateStr,
        numOfRows: 1,
        type: 'xml'
      },
      timeout: 10000
    });
    
    console.log('\n응답 상태:', res.status);
    console.log('응답 데이터:', typeof res.data === 'string' ? res.data.substring(0, 1000) : JSON.stringify(res.data, null, 2).substring(0, 1000));
    
    if (typeof res.data === 'string' && res.data.startsWith('<')) {
      const parser = new xml2js.Parser({ explicitArray: false });
      const parsed = await parser.parseStringPromise(res.data);
      console.log('\nresultCode:', parsed?.response?.header?.resultCode);
      console.log('resultMsg:', parsed?.response?.header?.resultMsg);
      
      if (parsed?.response?.header?.resultCode === '00') {
        const items = parsed?.response?.body?.items?.item;
        console.log('\n✅ 성공! 데이터:', items);
      } else {
        console.log('\n❌ 실패:', parsed?.response?.header?.resultMsg);
      }
    }
  } catch (e) {
    console.error('❌ 에러:', e.message);
    if (e.response) {
      console.error('응답 상태:', e.response.status);
      console.error('응답 데이터:', e.response.data);
    }
  }
}

testBuoy();
