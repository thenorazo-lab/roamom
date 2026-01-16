// backend/server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// 서버 시작 함수
async function startServer() {
  // MongoDB 연결 (비동기 대기)
  await connectDB();

  const app = express();
  const port = process.env.PORT || 3002;

// Security & middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
// 정적 파일 (예: 업로드된 이미지) 서빙
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Rate limiter (조건부 활성화)
const shouldDisableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';
if (!shouldDisableRateLimit) {
  const rateLimitOptions = {
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100
  };
  app.use(rateLimit(rateLimitOptions));
  console.log('[Rate Limit] ✅ 활성화 (분당', rateLimitOptions.max, '회)');
} else {
  console.log('[Rate Limit] ⚠️ 비활성화됨 (DISABLE_RATE_LIMIT=true)');
}

// 라우트로 분리된 엔드포인트를 사용합니다.
app.use('/api', require('./routes/weather'));
app.use('/api', require('./routes/japan'));
app.use('/api', require('./routes/points'));
app.use('/api', require('./routes/uploads'));
app.use('/api', require('./routes/inquiries'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/version', (req, res) => res.json({ version: '1.3.1', versionCode: 17 }));

  app.listen(port, () => {
      console.log(`Backend server is running on http://localhost:${port}`);
  });

  process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION', err);
  });
  process.on('unhandledRejection', (reason, promise) => {
      console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  });
}

// 서버 시작
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});