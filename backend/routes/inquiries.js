// routes/inquiries.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
console.log('[Routes] Inquiries router loaded');

// 개발자 문의 저장
router.post('/inquiry', async (req, res) => {
  console.log('POST /api/inquiry called');
  try {
    const { email, message } = req.body;
    console.log('Received:', { email, message });
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }

    console.log('readyState:', mongoose.connection.readyState);
    console.log('db:', mongoose.connection.db);
    const db = mongoose.connection.db || mongoose.connection.client.db('sea-weather-app');
    console.log('using db:', db);
    const inquiry = { email, message, createdAt: new Date() };
    console.log('Inserting inquiry...');
    await db.collection('inquiries').insertOne(inquiry);
    console.log('Inquiry inserted');

    res.json({ success: true });
  } catch (error) {
    console.error('Inquiry save error:', error);
    res.status(500).json({ error: 'Failed to save inquiry: ' + error.message });
  }
});

// 문의 목록 가져오기
router.get('/inquiries', async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    console.error('Inquiry fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// 문의 삭제
router.delete('/inquiry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Inquiry.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Inquiry delete error:', error);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

module.exports = router;