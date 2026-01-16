const axios = require('axios');

async function testInquiry() {
  try {
    console.log('POST 요청 시도...');
    // 문의 전송
    const postRes = await axios.post('http://localhost:3002/api/inquiry', {
      email: 'test@example.com',
      message: '테스트 문의 메시지'
    }, { timeout: 5000 });
    console.log('POST 응답:', postRes.data);

    console.log('GET 요청 시도...');
    // 문의 목록 가져오기
    const getRes = await axios.get('http://localhost:3002/api/inquiries', { timeout: 5000 });
    console.log('GET 응답:', getRes.data);

    // 삭제 테스트 (첫 번째 항목 삭제)
    if (getRes.data.length > 0) {
      console.log('DELETE 요청 시도...');
      const deleteRes = await axios.delete(`http://localhost:3002/api/inquiry/${getRes.data[0]._id}`, { timeout: 5000 });
      console.log('DELETE 응답:', deleteRes.data);
    }
  } catch (error) {
    console.error('에러 상태:', error.response?.status);
    console.error('에러 데이터:', error.response?.data);
    console.error('에러 메시지:', error.message);
    console.error('에러 코드:', error.code);
  }
}

testInquiry();