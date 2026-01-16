// routes/inquiries.js
const express = require('express');
const router = express.Router();
const sheets = require('../services/googleSheetsService');
console.log('[Routes] Inquiries router loaded');

// 개발자 문의 저장
router.post('/inquiry', async (req, res) => {
  try {
    const { email, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }

    // 구글 시트에 저장
    const spreadsheetId = '1uOXfkdeArzgLe_brMPp39IYpJRylgPAhbpacyY_jQak';
    const range = 'Sheet1!A:B'; // A: timestamp, B: email, C: message

    const values = [[new Date().toISOString(), email, message]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Inquiry save error:', error);
    res.status(500).json({ error: 'Failed to save inquiry' });
  }
});

module.exports = router;