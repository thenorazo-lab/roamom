const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB: 기존 연결 재사용');
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI.replace('/?', '/sea-weather-app?');
    
    if (!MONGODB_URI) {
      console.warn('MONGODB_URI가 설정되지 않았습니다. JSON 파일 모드로 작동합니다.');
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000
    });

    isConnected = true;
    console.log('MongoDB 연결 성공:', mongoose.connection.host);
    console.log('readyState:', mongoose.connection.readyState);
  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    // 연결 실패 시에도 앱은 계속 작동 (JSON 파일 fallback)
  }
};

module.exports = connectDB;
