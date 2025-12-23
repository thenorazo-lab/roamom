// routes/points.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sheets = require('../services/googleSheetsService');
const Point = require('../models/Point');

const DATA_FILE = path.join(__dirname, '..', 'data', 'points.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '756400';

// MongoDB 사용 가능 여부 확인
const useDB = () => {
  return process.env.MONGODB_URI && require('mongoose').connection.readyState === 1;
};

// JSON 파일 읽기 (fallback)
function readPoints() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

// JSON 파일 쓰기 (fallback)
function writePoints(points) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(points, null, 2), 'utf8');
}

// simple admin auth middleware
function requireAdmin(req, res, next) {
  const pass = req.headers['x-admin-password'] || req.query.adminPassword || req.body?.adminPassword;
  if (pass && pass === ADMIN_PASSWORD) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Public: list points
router.get('/points', async (req, res) => {
  try {
    if (useDB()) {
      const points = await Point.find({}).sort({ createdAt: -1 });
      return res.json(points);
    } else {
      const points = readPoints();
      return res.json(points);
    }
  } catch (error) {
    console.error('GET /points error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create point
router.post('/points', express.json(), requireAdmin, async (req, res) => {
  try {
    const { title, lat, lng, image, desc, url } = req.body;
    // accept zero coordinates; validate numerically
    if (!title || lat === undefined || lng === undefined || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return res.status(400).json({ error: 'title, lat, lng required' });
    }

    if (useDB()) {
      const id = 'p' + Date.now();
      const newPoint = new Point({
        id,
        title,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        image: image || '',
        desc: desc || '',
        url: url || ''
      });
      await newPoint.save();
      return res.json(newPoint);
    } else {
      const points = readPoints();
      const id = 'p' + Date.now();
      const p = { id, title, lat: parseFloat(lat), lng: parseFloat(lng), image: image || '', desc: desc || '', url: url || '' };
      points.push(p);
      writePoints(points);
      return res.json(p);
    }
  } catch (error) {
    console.error('POST /points error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update point
router.put('/points/:id', express.json(), requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, lat, lng, image, desc, url } = req.body;

    if (useDB()) {
      const point = await Point.findOne({ id });
      if (!point) return res.status(404).json({ error: 'Not found' });

      if (title !== undefined) point.title = title;
      if (lat !== undefined) point.lat = parseFloat(lat);
      if (lng !== undefined) point.lng = parseFloat(lng);
      if (image !== undefined) point.image = image;
      if (desc !== undefined) point.desc = desc;
      if (url !== undefined) point.url = url;

      await point.save();
      return res.json(point);
    } else {
      const points = readPoints();
      const idx = points.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      const p = points[idx];
      p.title = title ?? p.title;
      p.lat = lat !== undefined ? parseFloat(lat) : p.lat;
      p.lng = lng !== undefined ? parseFloat(lng) : p.lng;
      p.image = image ?? p.image;
      p.desc = desc ?? p.desc;
      p.url = url ?? p.url;
      points[idx] = p;
      writePoints(points);
      return res.json(p);
    }
  } catch (error) {
    console.error('PUT /points/:id error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete point
router.delete('/points/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    if (useDB()) {
      const result = await Point.deleteOne({ id });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    } else {
      let points = readPoints();
      const before = points.length;
      points = points.filter(p => p.id !== id);
      if (points.length === before) return res.status(404).json({ error: 'Not found' });
      writePoints(points);
      return res.json({ ok: true });
    }
  } catch (error) {
    console.error('DELETE /points/:id error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Public: click record
router.post('/points/click', express.json(), async (req, res) => {
  try {
    const { pointId } = req.body;
    let point;
    
    if (useDB()) {
      point = await Point.findOne({ id: pointId });
    } else {
      const points = readPoints();
      point = points.find(x => x.id === pointId);
    }

    const timestamp = new Date().toISOString();
    let recorded = false;
    
    try {
      const ok = await sheets.appendRecord([timestamp, '포인트공유', point?.title || '', pointId || '', point?.title || '', 'TRUE']);
      console.log('points.click appendRecord ->', ok);
      recorded = !!ok;
    } catch (e) {
      console.error('points.click appendRecord error', e.message);
      recorded = false;
    }
    
    return res.json({ ok: true, recorded });
  } catch (error) {
    console.error('POST /points/click error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
