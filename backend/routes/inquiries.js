// routes/inquiries.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Point = require('../models/Point');
const Inquiry = require('../models/Inquiry');
console.log('[Routes] Inquiries router loaded');

// 포인트 제보 저장
router.post('/inquiry', async (req, res) => {
  console.log('POST /api/inquiry called');
  try {
    const { email, desc } = req.body;
    console.log('Received:', { email, desc });
    if (!email || !desc) {
      console.warn('문의 전송: 필수값 누락', { email, desc });
      return res.status(400).json({ error: 'Email and desc are required' });
    }

    const inquiry = new Inquiry({
      email,
      desc
    });

    await inquiry.save();
    console.log('Inquiry saved');

    res.json({ success: true });
  } catch (error) {
    console.error('문의 저장 실패:', error);
    res.status(500).json({ error: 'Failed to save: ' + error.message, details: error });
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