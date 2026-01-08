require('dotenv').config();
const mongoose = require('mongoose');
const Point = require('./models/Point');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');
    
    const count = await Point.countDocuments();
    console.log(`\n📊 MongoDB 포인트 개수: ${count}개\n`);
    
    const points = await Point.find().select('id title lat lng');
    points.forEach(p => {
      console.log(`- ${p.title} (ID: ${p.id})`);
      console.log(`  위치: ${p.lat}, ${p.lng}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ 에러:', err.message);
    process.exit(1);
  }
}

checkDB();
