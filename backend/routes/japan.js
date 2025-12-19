// routes/japan.js
const express = require('express');
const router = express.Router();
const sheets = require('../services/googleSheetsService');

// 간단한 일본파고 이미지 목록 리턴 (실제 imocwx 사이트 규칙에 따라 URL을 생성할 수 있음)
// /api/japan-waves?date=2025-12-18
router.get('/japan-waves', async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD 권장
  const d = date || new Date().toISOString().slice(0,10);

  // 예시: 실제로는 imocwx의 이미지 규칙을 따라 URL을 생성해야 합니다.
  const images = [
    { time: d + ' 00:00', url: `https://www.imocwx.com/sample_wave_${d.replace(/-/g,'')}_0000.jpg` },
    { time: d + ' 03:00', url: `https://www.imocwx.com/sample_wave_${d.replace(/-/g,'')}_0300.jpg` },
    { time: d + ' 06:00', url: `https://www.imocwx.com/sample_wave_${d.replace(/-/g,'')}_0600.jpg` }
  ];

  // 기록
  const timestamp = new Date().toISOString();
  await sheets.appendRecord([timestamp, '일본파고', d, '', '', 'TRUE']).catch(()=>{});

  res.json({ date: d, images });
});

module.exports = router;
