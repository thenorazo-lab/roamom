// routes/inquiries.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Point = require('../models/Point');
console.log('[Routes] Inquiries router loaded');

// 포인트 제보 저장
router.post('/inquiry', async (req, res) => {
  console.log('POST /api/inquiry called');
  try {
    const { email, title, lat, lng, desc } = req.body;
    console.log('Received:', { email, title, lat, lng, desc });
    if (!email || !title || lat === undefined || lng === undefined || !desc) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 고유 ID 생성
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const point = new Point({
      id,
      title,
      lat,
      lng,
      desc,
      email
    });

    await point.save();
    console.log('Point saved');

    res.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save: ' + error.message });
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