# 🎯 Google AdSense 설정 가이드

## 📍 현재 광고 배치 위치

광고가 다음 위치에 자동으로 배치됩니다:

1. **메인 페이지**: 버튼 하단 (가장 높은 조회수)
2. **해루질 가이드 페이지**: 콘텐츠 하단
3. **일본 파고 페이지**: 이미지 캐러셀 하단

## 🚀 AdSense 승인 받기

### 1단계: AdSense 계정 가입
1. https://www.google.com/adsense 접속
2. Google 계정으로 로그인
3. "시작하기" 클릭
4. 웹사이트 URL 입력 (배포 후 도메인)
5. 이메일 설정 및 약관 동의

### 2단계: 웹사이트 연결
AdSense에서 제공하는 코드를 받습니다:
```
ca-pub-1234567890123456
```

### 3단계: 코드 적용

**A. frontend/.env 파일 수정**
```bash
REACT_APP_ADSENSE_CLIENT_ID=ca-pub-1234567890123456
```

**B. frontend/public/index.html 수정**
18번째 줄에서 `YOUR_CLIENT_ID_HERE`를 실제 클라이언트 ID로 교체:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
     crossorigin="anonymous"></script>
```

### 4단계: 광고 슬롯 ID 설정 (선택사항)

AdSense 대시보드에서 광고 단위를 만들면 슬롯 ID를 받습니다.
각 페이지의 AdSense 컴포넌트에서 slot 값을 수정:

**App.js - 메인 페이지:**
```javascript
<AdSense slot="실제_슬롯_ID_1" />
```

**App.js - 가이드 페이지:**
```javascript
<AdSense slot="실제_슬롯_ID_2" />
```

**JapanWaves.js:**
```javascript
<AdSense slot="실제_슬롯_ID_3" />
```

## 📝 승인 과정

1. **신청 후**: 1-2주 소요
2. **승인 기준**:
   - 충분한 콘텐츠 (✅ 완료)
   - 쉬운 탐색 구조 (✅ 완료)
   - 개인정보 보호정책 필요 (⚠️ 추가 권장)
   - 최소 6개월 된 도메인 (배포 후 시간 필요)

3. **승인 전**:
   - 현재는 "광고 영역 (AdSense 승인 후 표시)" 플레이스홀더 표시
   - 레이아웃은 그대로 유지

4. **승인 후**:
   - .env 파일 수정
   - index.html 수정
   - 앱 재배포
   - 광고 자동 표시

## 💡 팁

- **수익 최적화**: 승인 후 AdSense 대시보드에서 자동 광고 활성화 가능
- **광고 위치 변경**: 컴포넌트에서 `<AdSense />` 위치 조정
- **광고 제거**: 해당 줄 삭제 또는 주석 처리
- **모바일 최적화**: responsive={true} 설정으로 자동 반응형

## 🔧 문제 해결

**광고가 표시되지 않는 경우:**
1. 브라우저 광고 차단기 비활성화
2. .env 파일이 제대로 로드되었는지 확인
3. 개발 서버 재시작: `npm start`
4. 배포 환경에서 환경변수 설정 확인

**개인정보 보호정책 추가:**
AdSense 승인을 위해 개인정보 보호정책 페이지가 필요할 수 있습니다.
필요시 말씀해주시면 추가하겠습니다!
