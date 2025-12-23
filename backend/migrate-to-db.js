// 기존 points.json 데이터를 MongoDB로 마이그레이션하는 스크립트
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Point = require('./models/Point');

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_FILE = path.join(__dirname, 'data', 'points.json');

async function migrate() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI 환경변수가 설정되지 않았습니다.');
    console.log('💡 .env 파일에 MONGODB_URI를 추가하세요.');
    process.exit(1);
  }

  try {
    // MongoDB 연결
    console.log('🔌 MongoDB 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // 기존 데이터 읽기
    console.log('📖 points.json 읽는 중...');
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const points = JSON.parse(raw);
    console.log(`📊 총 ${points.length}개 포인트 발견`);

    // 기존 데이터 삭제 (선택사항)
    const existingCount = await Point.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  기존 데이터 ${existingCount}개 발견`);
      console.log('🗑️  기존 데이터 삭제 중...');
      await Point.deleteMany({});
    }

    // 새 데이터 삽입
    console.log('💾 데이터 마이그레이션 중...');
    const results = await Point.insertMany(points);
    console.log(`✅ ${results.length}개 포인트 마이그레이션 완료!`);

    // 결과 확인
    const finalCount = await Point.countDocuments();
    console.log(`\n📊 최종 결과: ${finalCount}개 포인트`);

    mongoose.connection.close();
    console.log('\n🎉 마이그레이션 성공!');
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

migrate();
