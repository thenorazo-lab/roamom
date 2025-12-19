// routes/points.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sheets = require('../services/googleSheetsService');

const DATA_FILE = path.join(__dirname, '..', 'data', 'points.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '756400';

function readPoints() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

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
router.get('/points', (req, res) => {
  const points = readPoints();
  res.json(points);
});

// Admin: create point
router.post('/points', express.json(), requireAdmin, (req, res) => {
  const { title, lat, lng, image, desc } = req.body;
  // accept zero coordinates; validate numerically
  if (!title || lat === undefined || lng === undefined || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) return res.status(400).json({ error: 'title, lat, lng required' });
  const points = readPoints();
  const id = 'p' + Date.now();
  const p = { id, title, lat: parseFloat(lat), lng: parseFloat(lng), image: image || '', desc: desc || '' };
  points.push(p);
  writePoints(points);
  res.json(p);
});

// Admin: update point
router.put('/points/:id', express.json(), requireAdmin, (req, res) => {
  const id = req.params.id;
  const { title, lat, lng, image, desc } = req.body;
  const points = readPoints();
  const idx = points.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const p = points[idx];
  p.title = title ?? p.title;
  p.lat = lat !== undefined ? parseFloat(lat) : p.lat;
  p.lng = lng !== undefined ? parseFloat(lng) : p.lng;
  p.image = image ?? p.image;
  p.desc = desc ?? p.desc;
  points[idx] = p;
  writePoints(points);
  res.json(p);
});

// Admin: delete point
router.delete('/points/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  let points = readPoints();
  const before = points.length;
  points = points.filter(p => p.id !== id);
  if (points.length === before) return res.status(404).json({ error: 'Not found' });
  writePoints(points);
  res.json({ ok: true });
});

// Public: click record
router.post('/points/click', express.json(), async (req, res) => {
  const { pointId } = req.body;
  const points = readPoints();
  const p = points.find(x => x.id === pointId);
  const timestamp = new Date().toISOString();
  let recorded = false;
  try {
    const ok = await sheets.appendRecord([timestamp, '포인트공유', p?.title || '', pointId || '', p?.title || '', 'TRUE']);
    console.log('points.click appendRecord ->', ok);
    recorded = !!ok;
  } catch (e) {
    console.error('points.click appendRecord error', e.message);
    recorded = false;
  }
  res.json({ ok: true, recorded });
});

module.exports = router;
