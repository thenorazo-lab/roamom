// routes/japan.js
const express = require('express');
const router = express.Router();
const sheets = require('../services/googleSheetsService');
const axios = require('axios');
const cheerio = require('cheerio');
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
    // 한국 시간대로 오늘 날짜 생성
    d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
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
    let iso;
    if (date) {
      iso = date;
    } else {
      // KST 기준 오늘 날짜를 안전하게 파싱
      const kstString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
      const kstDate = new Date(kstString);
      iso = kstDate.getFullYear() + '-' + String(kstDate.getMonth() + 1).padStart(2, '0') + '-' + String(kstDate.getDate()).padStart(2, '0');
    }
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
      images = slots.map(slot => {
        // 한국 시간대 기준으로 날짜 계산
        const baseDate = new Date(iso + 'T00:00:00+09:00'); // 한국 시간대 명시
        baseDate.setDate(baseDate.getDate() + slot.dayOffset);
        const yyyy = baseDate.getFullYear();
        const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
        const dd = String(baseDate.getDate()).padStart(2, '0');
        const label = `${yyyy}-${mm}-${dd} ${String(slot.hour).padStart(2, '0')}:00`;
        const file = String(slot.idx).padStart(2, '0');
        return {
          time: label,
          url: ENABLE_PROXY 
            ? `/api/japan-waves/image?file=${file}`
            : `${IMOCWX_STATIC_PREFIX}${file}${IMOCWX_STATIC_SUFFIX}`
        };
      });
    } else if (process.env.JAPAN_WAVE_SOURCE === 'imocwx') {
      try {
        // Time=0 to 24 파싱: 각 페이지에서 이미지와 날짜/시간 텍스트 직접 추출
        const slots = Array.from({ length: 25 }, (_, i) => ({ idx: i }));

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
            // 이미지 추출
            let imgUrl = '';
            $('img').each((_, el) => {
              const src = $(el).attr('src') || '';
              if (!src) return;
              const full = abs(src);
              if (/(\.png|\.jpg|\.jpeg|\.gif)$/i.test(full)) {
                imgUrl = full;
                return false;
              }
            });
            // 날짜/시간 텍스트 파싱 (페이지에서 추출 시도)
            let timeLabel = '';
            // 페이지 텍스트에서 날짜/시간 패턴 찾기 (YYYY-MM-DD HH:MM)
            const textContent = $('body').text();
            const dateTimeMatch = textContent.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
            if (dateTimeMatch) {
              timeLabel = dateTimeMatch[1];
            } else {
              // 추가 패턴 시도: 다른 형식 (MM/DD/YYYY HH:MM 등)
              const altMatch = textContent.match(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})/);
              if (altMatch) {
                // MM/DD/YYYY를 YYYY-MM-DD로 변환
                const [_, dateStr, timeStr] = altMatch[0].match(/(\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2})/);
                const [mm, dd, yyyy] = dateStr.split('/');
                timeLabel = `${yyyy}-${mm}-${dd} ${timeStr}`;
              } else {
                // 텍스트가 없으면 계산된 라벨 사용 (fallback: Time=0부터 21시 시작)
                const baseDate = new Date(iso + 'T00:00:00+09:00');
                const totalHours = 21 + (slot.idx * 3); // Time=0: 21시 시작
                const dayOffset = Math.floor(totalHours / 24);
                const hour = totalHours % 24;
                baseDate.setDate(baseDate.getDate() + dayOffset);
                const yyyy = baseDate.getFullYear();
                const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
                const dd = String(baseDate.getDate()).padStart(2, '0');
                timeLabel = `${yyyy}-${mm}-${dd} ${String(hour).padStart(2, '0')}:00`;
              }
            }
            if (imgUrl) results.push({ time: timeLabel, url: imgUrl });
          } catch (slotErr) {
            // skip failed slot
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
