// 좌표 근처 부이 찾기
const buoyStations = require('./utils.js').buoyStations;

const lat = 37.01466506047317;
const lon = 126.59436036832632;

const sortedBuoys = buoyStations
    .map(b => ({
        ...b,
        distance: Math.sqrt(Math.pow(b.lat - lat, 2) + Math.pow(b.lon - lon, 2))
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

console.log('좌표:', lat, lon);
console.log('\n가장 가까운 부이 5개:');
sortedBuoys.forEach((b, i) => {
    console.log(`${i+1}. ${b.name} (${b.code}) - 거리: ${b.distance.toFixed(4)}`);
});

// 첫 번째 부이 테스트
const axios = require('axios');
const xml2js = require('xml2js');
require('dotenv').config();

async function testBuoy(obsCode) {
    try {
        console.log(`\n부이 ${obsCode} 테스트 (reqDate 없이):`);
        const res = await axios.get('https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService', {
            params: {
                serviceKey: process.env.DATA_GO_KR_API_KEY,
                obsCode: obsCode,
                numOfRows: 1,
                type: 'xml'
            },
            timeout: 10000
        });
        
        if (typeof res.data === 'string' && res.data.startsWith('<')) {
            const parser = new xml2js.Parser({ explicitArray: false });
            const parsed = await parser.parseStringPromise(res.data);
            console.log('resultCode:', parsed?.response?.header?.resultCode);
            console.log('resultMsg:', parsed?.response?.header?.resultMsg);
            
            if (parsed?.response?.header?.resultCode === '00') {
                const item = parsed?.response?.body?.items?.item;
                console.log('데이터:', item ? 'OK' : 'null');
                if (item) {
                    console.log('수온:', item.wtem);
                    console.log('풍속:', item.wspd);
                    console.log('파고:', item.wvhgt);
                }
            }
        }
    } catch (e) {
        console.error('에러:', e.message);
    }
}

(async () => {
    for (let i = 0; i < Math.min(3, sortedBuoys.length); i++) {
        await testBuoy(sortedBuoys[i].code);
    }
})();
