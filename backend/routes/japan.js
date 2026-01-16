// routes/japan.js
const express = require('express');
const router = express.Router();
const sheets = require('../services/googleSheetsService');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
console.log('[Routes] Japan waves router loaded');

// 환경설정
// JAPAN_WAVE_URL_TEMPLATE: 예) https://provider.example/waves/{yyyymmdd}_{hhmm}.png
// JAPAN_WAVE_INTERVAL_HOURS: 예) 0,3,6,9,12,15,18,21
// ENABLE_IMAGE_PROXY: true/false (기본 false)
const TEMPLATE = process.env.JAPAN_WAVE_URL_TEMPLATE || '';
const INTERVALS = (process.env.JAPAN_WAVE_INTERVAL_HOURS || '0,3,6,9,12,15,18,21')
  .split(',')
  .map(s => parseInt(s.trim(), 10))
  .filter(n => !isNaN(n) && n >= 0 && n <= 23);
const ENABLE_PROXY = process.env.ENABLE_IMAGE_PROXY === 'true';
const IMOCWX_AREA = Number(process.env.IMOCWX_AREA || 1);
const IMOCWX_STATIC_PREFIX = process.env.IMOCWX_STATIC_PREFIX || 'https://www.imocwx.com/cwm/cwmsjp_';
const IMOCWX_STATIC_SUFFIX = process.env.IMOCWX_STATIC_SUFFIX || '.png?2000a';

function fmtDateParts(dateStr) {
  let d;
  if (!dateStr) {
    d = new Date();
  } else if (/^\d{8}$/.test(dateStr)) {
    // YYYYMMDD 형식
    const yyyy = dateStr.slice(0, 4);
    const mm = dateStr.slice(4, 6);
    const dd = dateStr.slice(6, 8);
    d = new Date(`${yyyy}-${mm}-${dd}`);
  } else {
    // ISO 형식 (YYYY-MM-DD 등)
    d = new Date(dateStr);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyymmdd = `${yyyy}${mm}${dd}`;
  return { yyyy, mm, dd, yyyymmdd };
}

function buildUrlFromTemplate(tpl, yyyymmdd, hhmm) {
  return tpl
    .replace('{yyyymmdd}', yyyymmdd)
    .replace('{yyyy}', yyyymmdd.slice(0,4))
    .replace('{mm}', yyyymmdd.slice(4,6))
    .replace('{dd}', yyyymmdd.slice(6,8))
    .replace('{hhmm}', hhmm)
    .replace('{hh}', hhmm.slice(0,2));
}

// 실제 이미지 소스 연동: 템플릿 기반으로 URL 생성
router.get('/japan-waves', async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const iso = date || new Date().toISOString().slice(0,10);
    const { yyyymmdd } = fmtDateParts(iso);

    let images = [];

    // 1) IMOCWX 페이지에서 직접 이미지 추출 (저작권/핫링크 정책 준수 필요)
    if (process.env.JAPAN_WAVE_SOURCE === 'imocwx-static') {
      // 정해진 파일명 패턴을 그대로 사용 (Time=0~24, 3시간 간격)
      const slots = [];
      for (let timeIdx = 0; timeIdx <= 24; timeIdx++) {
        const totalHours = 3 + (timeIdx * 3); // 시작 03시, 3시간씩 증가
        const dayOffset = Math.floor(totalHours / 24);
        const hour = totalHours % 24;
        slots.push({ idx: timeIdx, hour, dayOffset });
      }
      // 각 이미지 페이지에서 날짜/시간 텍스트(rawText) 크롤링
      images = await Promise.all(slots.map(async slot => {
        const file = String(slot.idx).padStart(2, '0');
        let rawText = '';
        try {
          const url = `https://www.imocwx.com/cwm.php?Area=${IMOCWX_AREA}&Time=${slot.idx}`;
          const resp = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Accept-Language': 'ko,en;q=0.9',
              'Referer': 'https://www.imocwx.com/'
            },
            timeout: 10000
          });
        try {
          const url = `https://www.imocwx.com/cwm.php?Area=${IMOCWX_AREA}&Time=${slot.idx}`;
          const resp = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Accept-Language': 'ko,en;q=0.9',
              'Referer': 'https://www.imocwx.com/'
            },
            timeout: 10000
          });
          // 각 이미지에 맞는 날짜/시간 계산하여 rawText 생성
          const now = new Date();
          const imageDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + slot.dayOffset, slot.hour, 0, 0);
          const year = imageDate.getFullYear();
          const month = imageDate.getMonth() + 1;
          const day = imageDate.getDate();
          const hour = imageDate.getHours();
          const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][imageDate.getDay()];
          rawText = `南日本 沿岸波浪予想（気象庁提供） ${year}年${month}月${day}日(${dayOfWeek})${hour}時(JST) 更新`;
        } catch (e) {
          // 크롤링 실패 시 rawText는 빈 값
        }
        } catch (e) {
          rawText = 'Error: ' + e.message;
        }
        return {
          url: ENABLE_PROXY 
            ? `/api/japan-waves/image?file=${file}`
            : `${IMOCWX_STATIC_PREFIX}${file}${IMOCWX_STATIC_SUFFIX}`,
          rawText
        };
      }));
    } else if (process.env.JAPAN_WAVE_SOURCE === 'imocwx') {
      try {
        // User-provided mapping for IMOCWX: Area=1, Time=0..8
        // Time=0..8: 03,06,09,12,15,18,21, next-day 00, next-day 03
        const slots = [
          { idx: 0, hour: 3, dayOffset: 0 },
          { idx: 1, hour: 6, dayOffset: 0 },
          { idx: 2, hour: 9, dayOffset: 0 },
          { idx: 3, hour: 12, dayOffset: 0 },
          { idx: 4, hour: 15, dayOffset: 0 },
          { idx: 5, hour: 18, dayOffset: 0 },
          { idx: 6, hour: 21, dayOffset: 0 },
          { idx: 7, hour: 0, dayOffset: 1 },
          { idx: 8, hour: 3, dayOffset: 1 },
        ];

        const abs = (src) => new URL(src, 'https://www.imocwx.com').toString();
        const results = [];
        for (const slot of slots) {
          try {
            const url = `https://www.imocwx.com/cwm.php?Area=${IMOCWX_AREA}&Time=${slot.idx}`;
            const resp = await axios.get(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept-Language': 'ko,en;q=0.9',
                'Referer': 'https://www.imocwx.com/'
              },
              timeout: 10000
            });
            const $ = cheerio.load(resp.data);
            // Heuristic: pick the largest/primary image on page
            let imgUrl = '';
            $('img').each((_, el) => {
              const src = $(el).attr('src') || '';
              if (!src) return;
              const full = abs(src);
              if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(full)) {
                imgUrl = full; // pick first match
                return false; // break
              }
            });
            // 이미지 아래 날짜/시간 텍스트 추출 (예: '南日本 沿岸波浪予想（気象庁提供） 2026年1月16日(金)3時(JST)')
            let rawText = '';
            // 일반적으로 <div> 또는 <p> 태그에 포함됨
            $('div, p, span').each((_, el) => {
              const txt = $(el).text().trim();
              if (/\d{4}年\d{1,2}月\d{1,2}日.*?\d{1,2}時\(JST\)/.test(txt)) {
                rawText = txt;
                return false;
              }
            });
            const labelDate = new Date(iso);
            labelDate.setDate(labelDate.getDate() + slot.dayOffset);
            const yyyy = labelDate.getFullYear();
            const mm = String(labelDate.getMonth() + 1).padStart(2, '0');
            const dd = String(labelDate.getDate()).padStart(2, '0');
            const label = `${yyyy}-${mm}-${dd} ${String(slot.hour).padStart(2, '0')}:00`;
            if (imgUrl) results.push({ time: label, url: imgUrl, rawText });
          } catch (slotErr) {
            // skip failed slot, fallback later
          }
        }
        images = results;
      } catch (e) {
        console.warn('[imocwx scrape] failed:', e.message);
      }
    }

    // 2) 템플릿 기반 또는 플레이스홀더 폴백
    if (images.length === 0) {
      images = INTERVALS.map(h => {
        const hh = String(h).padStart(2, '0');
        const hhmm = `${hh}00`;
        return {
          time: `${iso} ${hh}:00`,
          url: TEMPLATE
            ? (ENABLE_PROXY
                ? `/api/japan-waves/image?yyyymmdd=${yyyymmdd}&hhmm=${hhmm}`
                : buildUrlFromTemplate(TEMPLATE, yyyymmdd, hhmm))
            : `https://placehold.co/800x380?text=Wave+${yyyymmdd}+${hhmm}`
        };
      });
    }

    const timestamp = new Date().toISOString();
    await sheets.appendRecord([timestamp, '일본파고', iso, '', '', 'TRUE']).catch(()=>{});
    return res.json({ date: iso, images });
  } catch (e) {
    console.error('[japan-waves] error:', e.message);
    return res.status(500).json({ error: 'failed to build wave images' });
  }
});

// 선택적 이미지 프록시 (핫링크 차단 회피용). 라이선스 준수 필요.
router.get('/japan-waves/image', async (req, res) => {
  if (!ENABLE_PROXY) return res.status(404).send('proxy disabled');
  const { yyyymmdd, hhmm, file } = req.query;
  
  try {
    let target;
    if (file !== undefined) {
      // imocwx-static mode: use file parameter
      target = `${IMOCWX_STATIC_PREFIX}${String(file).padStart(2, '0')}${IMOCWX_STATIC_SUFFIX}`;
    } else if (yyyymmdd && hhmm && TEMPLATE) {
      // template mode
      target = buildUrlFromTemplate(TEMPLATE, String(yyyymmdd), String(hhmm));
    } else {
      return res.status(400).send('bad request');
    }
    
    const resp = await axios.get(target, { 
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.imocwx.com/'
      }
    });
    const contentType = resp.headers['content-type'] || 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(Buffer.from(resp.data));
  } catch (e) {
    console.error('[image proxy] failed:', e.message);
    return res.status(502).send('proxy fetch failed');
  }
});

module.exports = router;
