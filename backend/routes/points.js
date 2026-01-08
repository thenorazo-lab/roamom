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
  const hasURI = !!process.env.MONGODB_URI;
  const readyState = require('mongoose').connection.readyState;
  const result = hasURI && readyState === 1;
  console.log(`[useDB] URI: ${hasURI}, ReadyState: ${readyState}, Result: ${result}`);
  return result;
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

// JSON 파일 쓰기 (fallback) - 백업 포함
function writePoints(points) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'data', 'backups');
  
  // 로컬 환경에서만 백업 생성 (App Engine은 읽기 전용 파일시스템)
  if (process.env.NODE_ENV !== 'production' && !process.env.GAE_ENV) {
    // 백업 디렉토리 생성
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 기존 파일 백업
    if (fs.existsSync(DATA_FILE)) {
      try {
        const backupFile = path.join(backupDir, `points-${timestamp}.json`);
        fs.copyFileSync(DATA_FILE, backupFile);
        console.log(`✅ 백업 생성: ${backupFile}`);
      } catch (backupError) {
        console.warn('⚠️  백업 생성 실패 (무시됨):', backupError.message);
      }
    }
    
    // 오래된 백업 정리 (30개 이상 시 오래된 것 삭제)
    try {
      const backups = fs.readdirSync(backupDir).filter(f => f.startsWith('points-')).sort();
      if (backups.length > 30) {
        backups.slice(0, backups.length - 30).forEach(f => {
          fs.unlinkSync(path.join(backupDir, f));
        });
      }
    } catch (e) {
      console.error('백업 정리 실패:', e.message);
    }
  }
  
  // 새 데이터 저장
  fs.writeFileSync(DATA_FILE, JSON.stringify(points, null, 2), 'utf8');
  console.log(`✅ 포인트 저장 완료: ${points.length}개 - ${new Date().toISOString()}`);
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
      console.log(`✅ 포인트 추가됨: ${title} (ID: ${id})`);
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
      console.log(`✅ 포인트 수정됨: ${p.title} (ID: ${id})`);
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
      console.log(`✅ 포인트 삭제됨: ID ${id}`);
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
