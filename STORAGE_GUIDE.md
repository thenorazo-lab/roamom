# 데이터 저장 가이드

## 현재 상황
- **App Engine**: 읽기 전용 파일 시스템 (파일 저장 불가)
- **MongoDB**: 인증 실패 (`bad auth : authentication failed`)
- **임시 해결**: 로컬에서만 백업 생성

## ⚠️ 중요: 데이터 안전 보장 방법

### 방법 1: MongoDB 사용 (권장) ✅

MongoDB Atlas를 사용하면 **자동 백업**과 **영구 저장**이 보장됩니다.

#### MongoDB 설정 확인:
```bash
# .env 파일 확인
cd backend
cat .env | grep MONGODB_URI
```

현재 URI: `mongodb+srv://thenorazo_db_user:WZla5FbwtOhMtgzl@roamom-cluster.4f232kg.mongodb.net/?appName=roamom-cluster`

#### 문제: 인증 실패
- 비밀번호가 틀렸거나
- 사용자가 삭제되었거나
- IP 화이트리스트 문제

#### 해결 방법:
1. MongoDB Atlas 로그인: https://cloud.mongodb.com/
2. Database Access → 사용자 확인/재생성
3. Network Access → IP 화이트리스트에 `0.0.0.0/0` 추가 (모든 IP 허용)
4. 새 비밀번호로 `.env` 업데이트
5. App Engine 환경 변수 업데이트:
   ```bash
   gcloud app deploy --set-env-vars MONGODB_URI="새로운_URI"
   ```

### 방법 2: Google Cloud Storage 백업 (선택)

파일 저장이 필요하면 Cloud Storage 사용:

```javascript
// backend/config/storage.js
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('your-bucket-name');

async function backupPoints(points) {
  const timestamp = new Date().toISOString();
  const file = bucket.file(`backups/points-${timestamp}.json`);
  await file.save(JSON.stringify(points, null, 2));
}
```

### 방법 3: Git 자동 커밋 (로컬 전용)

로컬 개발 환경에서만:
```bash
cd backend/data
git add points.json
git commit -m "Data backup: $(date)"
git push
```

## 현재 구현된 안전장치

### 1. 백업 시스템 ✅
- **로컬 환경**: 저장 시 자동 백업 (`backend/data/backups/`)
- **App Engine**: 백업 비활성화 (읽기 전용 파일시스템)

### 2. 로깅 강화 ✅
- 모든 CRUD 작업에 로그 출력
- 포인트 추가: `✅ 포인트 추가됨: {title} (ID: {id})`
- 포인트 수정: `✅ 포인트 수정됨: {title} (ID: {id})`
- 포인트 삭제: `✅ 포인트 삭제됨: ID {id}`

### 3. 프론트엔드 피드백 ✅
- 저장 성공 시 alert 표시
- 에러 발생 시 상세 메시지 표시
- 콘솔에 모든 작업 로그 출력

## 사용자 행동 지침

### 포인트 추가 시:
1. 관리자 페이지에서 포인트 추가
2. **"✅ ... 포인트가 서버에 저장되었습니다!" 메시지 확인**
3. 메시지가 안 나오면 → 저장 실패, 다시 시도

### 데이터 확인:
```bash
# API로 현재 저장된 포인트 확인
curl https://able-tide-481608-m5.du.r.appspot.com/api/points

# 또는 PowerShell
Invoke-WebRequest -Uri "https://able-tide-481608-m5.du.r.appspot.com/api/points" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### 수동 백업 (로컬):
```bash
cd backend/data
cp points.json points-backup-$(date +%Y%m%d).json
git add points.json
git commit -m "Manual backup"
git push
```

## 다음 할 일

1. **MongoDB 인증 문제 해결** (최우선)
   - Atlas 콘솔에서 사용자 재생성
   - 비밀번호 재설정
   - App Engine 환경 변수 업데이트

2. **데이터 마이그레이션**
   ```bash
   cd backend
   node migrate-to-db.js  # points.json → MongoDB
   ```

3. **MongoDB 사용 확인**
   ```javascript
   // points.js에서 useDB() 함수가 true 반환하는지 확인
   console.log('Using MongoDB:', useDB());
   ```

4. **정기 백업 자동화** (선택)
   - Google Cloud Scheduler로 매일 백업
   - 또는 GitHub Actions로 자동 커밋

## 현재 데이터 상태

현재 points.json에 저장된 포인트:
- p1: 포인트1
- p2: 포인트2
- p1766135924315: e2e-test
- p1766270365423: 슬도 문어낙지 포인트

**총 4개** (이전 20개는 복구 불가능)

## 결론

**가장 안전한 방법**: MongoDB 인증 문제를 해결하고 MongoDB를 사용하세요.
- 자동 백업 보장
- 고가용성
- App Engine 읽기 전용 파일시스템 문제 없음
- 확장성 좋음

**임시 방법**: 현재는 로컬 백업만 작동하지만, 배포 시에는 **데이터가 저장되지만 백업은 안 됨**.
