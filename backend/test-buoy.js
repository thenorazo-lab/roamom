// 부이 API 테스트 스크립트
require('dotenv').config();
const axios = require('axios');
const xml2js = require('xml2js');

async function testBuoyAPI(obsCode, dateStr = null) {
  try {
    const today = new Date();
    // 날짜를 하루 전으로 설정 (데이터가 아직 없을 수 있음)
    if (!dateStr) {
      today.setDate(today.getDate() - 1);
      dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    }
    const url = 'https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService';
    
    console.log('\n========================================');
    console.log(`테스트: 부이 관측소 ${obsCode}`);
    console.log(`날짜: ${dateStr}`);
    console.log(`API 키: ${process.env.DATA_GO_KR_API_KEY ? '설정됨' : '❌ 없음'}`);
    console.log('========================================\n');
    
    // 여러 파라미터 조합 시도
    const testCases = [
      // 케이스 1: reqDate 없이
      {
        serviceKey: process.env.DATA_GO_KR_API_KEY,
        obsCode: obsCode,
        numOfRows: 1
      },
      // 케이스 2: 원래 방식
      {
        serviceKey: process.env.DATA_GO_KR_API_KEY,
        obsCode: obsCode,
        reqDate: dateStr,
        numOfRows: 1
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const params = testCases[i];
      console.log(`\n케이스 ${i + 1} 시도:`, { ...params, serviceKey: '***' });
      console.log(`\n케이스 ${i + 1} 시도:`, { ...params, serviceKey: '***' });
    
      const res = await axios.get(url, { params, timeout: 10000 });
      
      console.log('응답 상태:', res.status);
      console.log('응답 타입:', typeof res.data);
      console.log('응답 내용 (첫 500자):', 
        typeof res.data === 'string' 
          ? res.data.substring(0, 500) 
          : JSON.stringify(res.data, null, 2).substring(0, 500)
      );
      
      let items = null;
      
      // XML 응답 처리
      if (typeof res.data === 'string' && res.data.startsWith('<')) {
        console.log('\n✅ XML 응답 감지, 파싱 중...');
        const parser = new xml2js.Parser({ explicitArray: false });
        const parsed = await parser.parseStringPromise(res.data);
        
        console.log('resultCode:', parsed?.response?.header?.resultCode);
        console.log('resultMsg:', parsed?.response?.header?.resultMsg);
        
        if (parsed?.response?.header?.resultCode === '00') {
          items = parsed?.response?.body?.items?.item;
          if (items) {
            console.log('✅✅✅ 이 케이스가 성공했습니다!');
            break; // 성공하면 루프 종료
          }
        }
      } else {
        // JSON 응답 처리
        console.log('\n✅ JSON 응답 감지');
        console.log('resultCode:', res.data?.response?.header?.resultCode);
        console.log('resultMsg:', res.data?.response?.header?.resultMsg);
        
        if (res.data?.response?.header?.resultCode === '00') {
          items = res.data?.response?.body?.items?.item;
          if (items) {
            console.log('✅✅✅ 이 케이스가 성공했습니다!');
            break;
          }
        }
      }
    }
    
    if (items) {
      const latest = Array.isArray(items) ? items[0] : items;
      console.log('\n✅ 데이터 발견!');
      console.log('관측소:', latest.obsvtrNm);
      console.log('관측시간:', latest.obsrvnDt);
      console.log('파고 (wvhgt):', latest.wvhgt);
      console.log('유속 (crsp):', latest.crsp);
      console.log('유향 (crdir):', latest.crdir);
      console.log('수온 (wtem):', latest.wtem);
      console.log('풍속 (wspd):', latest.wspd);
      console.log('풍향 (wndrct):', latest.wndrct);
      
      return {
        station_name: latest.obsvtrNm,
        obs_time: latest.obsrvnDt,
        wave_height: latest.wvhgt || null,
        current_speed: latest.crsp || null,
        current_direction: latest.crdir || null,
        water_temp: latest.wtem || null,
        wind_speed: latest.wspd || null,
        wind_direction: latest.wndrct || null
      };
    } else {
      console.log('\n❌ items가 null 또는 undefined');
      return null;
    }
  } catch (e) {
    console.error('\n❌ 에러 발생:', e.message);
    if (e.response) {
      console.error('HTTP 상태:', e.response.status);
      console.error('응답 데이터:', e.response.data);
    }
    return null;
  }
}

// 서해안 근처 부이 관측소 테스트
async function main() {
  console.log('부이 API 테스트 시작...\n');
  
  // 좌표: 36.594, 126.558 (충남 서해안)
  const testBuoys = [
    { code: '22102', name: '외연도' },
    { code: '22185', name: '가대암' },
    { code: '22189', name: '십이동파' }
  ];
  
  for (const buoy of testBuoys) {
    const result = await testBuoyAPI(buoy.code);
    if (result) {
      console.log('\n✅ 성공적으로 데이터를 가져왔습니다!');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n❌ 데이터를 가져오지 못했습니다.');
    }
    console.log('\n');
  }
}

main().then(() => {
  console.log('테스트 완료');
  process.exit(0);
}).catch(err => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
