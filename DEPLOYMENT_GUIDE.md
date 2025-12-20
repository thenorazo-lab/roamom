# 🚀 해루질가자 앱 배포 가이드

## 📋 배포 전 체크리스트

- ✅ 비밀번호 힌트 제거됨
- ✅ 광고 위치 설정 완료
- ✅ 환경변수 기반 API 호출 설정
- ✅ Vercel, Render 설정 파일 생성

---

## 1️⃣ GitHub에 코드 업로드

### 1단계: Git 초기화 및 커밋

```powershell
cd c:\Users\금진\sea-weather-app

# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit - 해루질가자 웹앱"
```

### 2단계: GitHub 저장소 생성

1. [GitHub](https://github.com) 접속 및 로그인
2. 우측 상단 `+` → `New repository` 클릭
3. Repository name: `sea-weather-app` (또는 원하는 이름)
4. Public 선택 (필수: Vercel/Render 무료 플랜)
5. **Create repository** 클릭

### 3단계: GitHub에 푸시

```powershell
# GitHub 저장소 연결 (your-username을 실제 사용자명으로 변경)
git remote add origin https://github.com/your-username/sea-weather-app.git

# 메인 브랜치로 설정
git branch -M main

# 푸시
git push -u origin main
```

---

## 2️⃣ 백엔드 배포 (Render)

### 1단계: Render 계정 생성

1. [Render.com](https://render.com) 접속
2. "Get Started for Free" 클릭
3. GitHub 계정으로 가입

### 2단계: 백엔드 서비스 생성

1. Dashboard에서 `New +` → `Web Service` 클릭
2. GitHub 저장소 연결
3. 설정:
   - **Name**: `sea-weather-backend`
   - **Region**: Oregon (무료)
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### 3단계: 환경 변수 설정

"Environment" 탭에서 다음 변수 추가:

```
PORT = 10000
NODE_ENV = production
DISABLE_RATE_LIMIT = true
JAPAN_WAVE_SOURCE = imocwx-static
ENABLE_IMAGE_PROXY = true
DATA_GO_KR_API_KEY = 3eb83f3b40e63c30163c96bbb288129158290f872c369cadf157f34f91fdb070
KHOA_API_KEY = wldhxng34hkddbsgm81lwldhxng34hkddbsgm81l==
ADMIN_PASSWORD = 756400
SHEETS_ID = 1cnMuiCzIT1MqAzuFcl-iXDpJnk49zcdSJQixTzkKTwY
```

⚠️ **GOOGLE_SERVICE_ACCOUNT_JSON_PATH**는 파일 경로라 Render에서는 작동 안함. 
   → 필요시 JSON 내용을 환경변수로 설정 가능

### 4단계: 배포 및 URL 확인

1. "Create Web Service" 클릭
2. 배포 완료까지 5-10분 대기
3. **백엔드 URL 복사** (예: `https://sea-weather-backend.onrender.com`)

---

## 3️⃣ 프론트엔드 배포 (Vercel)

### 1단계: Vercel 계정 생성

1. [Vercel.com](https://vercel.com) 접속
2. "Start Deploying" 클릭
3. GitHub 계정으로 가입

### 2단계: 프론트엔드 프로젝트 배포

1. "Add New..." → "Project" 클릭
2. GitHub 저장소 Import
3. 설정:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (자동 설정)
   - **Output Directory**: `build` (자동 설정)

### 3단계: 환경 변수 설정

"Environment Variables" 섹션에서 추가:

```
REACT_APP_API_URL = https://sea-weather-backend.onrender.com
REACT_APP_ADSENSE_CLIENT_ID = YOUR_CLIENT_ID_HERE
```

⚠️ **REACT_APP_API_URL**에 Render에서 복사한 백엔드 URL 입력!

### 4단계: 배포

1. "Deploy" 클릭
2. 배포 완료까지 3-5분 대기
3. **프론트엔드 URL 확인** (예: `https://sea-weather-app.vercel.app`)

---

## 4️⃣ 배포 후 테스트

### 테스트 체크리스트

1. **메인 페이지** 접속 확인
2. **바다날씨** 페이지:
   - 지도 클릭 → 날씨 정보 표시 확인
   - ❌ 에러 발생 시 → 백엔드 URL 확인
3. **일본 파고** 페이지:
   - 이미지 25개 표시 확인
   - ❌ 표시 안됨 → 백엔드 CORS 설정 확인
4. **해루질 포인트** 페이지:
   - 지도에 핀 표시 확인
   - 핀 클릭 → 이미지/설명 팝업 확인
5. **포인트 관리자** 페이지:
   - 비밀번호 `756400` 입력 → 로그인 확인
   - 포인트 추가/삭제 테스트

### 문제 해결

**백엔드 연결 실패:**
```
Error: Network Error
```
→ Vercel 환경 변수에서 `REACT_APP_API_URL` 확인
→ Render 백엔드가 실행 중인지 확인

**CORS 에러:**
```
Access to fetch blocked by CORS policy
```
→ 백엔드 `server.js`의 CORS 설정 확인:
```javascript
app.use(cors({ origin: '*' })); // 또는 특정 도메인
```

---

## 5️⃣ Google AdSense 신청

### 1단계: AdSense 계정 생성

1. [Google AdSense](https://www.google.com/adsense) 접속
2. "시작하기" 클릭
3. 웹사이트 URL 입력: `https://sea-weather-app.vercel.app`
4. 이메일 설정 및 약관 동의

### 2단계: 승인 대기

- **소요 시간**: 1-2주
- **승인 기준**:
  - ✅ 충분한 콘텐츠
  - ✅ 쉬운 탐색 구조
  - ✅ 독창적인 콘텐츠
  - ⚠️ 개인정보 보호정책 필요 (아래 참조)

### 3단계: 승인 후 광고 활성화

승인 이메일을 받으면:

1. AdSense에서 **클라이언트 ID** 복사 (예: `ca-pub-1234567890`)
2. Vercel 환경 변수 수정:
   ```
   REACT_APP_ADSENSE_CLIENT_ID = ca-pub-1234567890123456
   ```
3. `frontend/public/index.html` 18번째 줄 수정:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
        crossorigin="anonymous"></script>
   ```
4. GitHub에 커밋 및 푸시 → Vercel 자동 재배포
5. 24시간 내 광고 표시 시작!

---

## 6️⃣ 개인정보 보호정책 추가 (AdSense 필수)

### 간단한 정책 페이지 추가

**frontend/src/pages/Privacy.js** 생성:
```javascript
export default function Privacy() {
  return (
    <div className="container" style={{textAlign:'left', maxWidth:'800px', padding:'20px'}}>
      <h1>개인정보 보호정책</h1>
      <p>최종 수정일: 2025년 12월 21일</p>
      
      <h2>수집하는 정보</h2>
      <p>해루질가자는 다음 정보를 수집하지 않습니다:
      <ul>
        <li>개인 식별 정보</li>
        <li>위치 정보 (지도 클릭 시 임시 사용)</li>
      </ul>
      </p>
      
      <h2>Google AdSense</h2>
      <p>본 사이트는 Google AdSense를 사용합니다. Google은 쿠키를 사용하여 광고를 제공할 수 있습니다.</p>
      
      <h2>문의</h2>
      <p>이메일: your-email@example.com</p>
    </div>
  );
}
```

**App.js에 라우트 추가:**
```javascript
<Route path="/privacy" element={<Privacy />} />
```

---

## 7️⃣ 커스텀 도메인 연결 (선택)

### Vercel에서 도메인 연결

1. 도메인 구매 (예: `harujil.com`)
2. Vercel Dashboard → Settings → Domains
3. 도메인 추가 및 DNS 설정
4. 24시간 내 활성화

---

## 🎉 배포 완료!

축하합니다! 이제:
- ✅ 웹사이트 전세계 공개
- ✅ HTTPS 보안 연결
- ✅ AdSense 승인 대기 가능
- ✅ 자동 배포 (GitHub 푸시 시)

## 📊 모니터링

- **Vercel Analytics**: 방문자 수 확인
- **Render Logs**: 백엔드 에러 확인
- **AdSense Reports**: 광고 수익 확인

---

## 🆘 도움이 필요하면

문제 발생 시:
1. Vercel 로그 확인
2. Render 로그 확인
3. 브라우저 개발자 도구 (F12) 확인
4. 환경 변수 재확인

Happy Deploying! 🚀🌊
