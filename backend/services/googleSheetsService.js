// backend/services/googleSheetsService.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');

// 구글 시트 ID와 서비스 계정 키(.json) 파일 경로를 .env 파일에서 가져옵니다.
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
let creds;
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (fs.existsSync(credsPath)) {
        creds = require(credsPath);
    }
}

async function appendRecord(rowData) {
    // 환경 변수가 설정되지 않았거나, 로컬 개발 환경일 경우 콘솔에만 기록합니다.
    if (!SHEET_ID || !creds) {
        console.log('[Logger] Google Sheets not configured. Logging to console:', rowData);
        // 로컬에 CSV로 기록하는 것도 좋은 방법입니다.
        try {
            const logDir = path.join(__dirname, '..', 'logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir);
            }
            const logFile = path.join(logDir, 'usage.csv');
            const csvLine = Object.values(rowData).map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',') + '\n';
            if (!fs.existsSync(logFile)) {
                const header = Object.keys(rowData).join(',') + '\n';
                fs.writeFileSync(logFile, header);
            }
            fs.appendFileSync(logFile, csvLine);
        } catch (e) {
            console.error('[Logger] Failed to write to local CSV log:', e.message);
        }
        return false; // 시트 기록은 실패했음을 명확히 합니다.
    }

    try {
        const doc = new GoogleSpreadsheet(SHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['기록용']; // 시트 이름: '기록용'
        await sheet.addRow(rowData);
        console.log('[Logger] Successfully appended record to Google Sheet.');
        return true;
    } catch (error) {
        console.error('[Logger] Error appending to Google Sheet:', error.message);
        return false;
    }
}

module.exports = { appendRecord };


