// backend/server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// Security & middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
// app.use('/api', require('./routes/japan')); // 추후 구현
// app.use('/api', require('./routes/points')); // 추후 구현

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});