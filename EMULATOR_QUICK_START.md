# 🎯 초간단 시작 가이드 (Pixel 5 에뮬레이터)

## 단 3단계로 시작! ⚡

### 1️⃣ Android Studio 설치
- [다운로드](https://developer.android.com/studio)
- 기본 설정으로 설치

### 2️⃣ Pixel 5 에뮬레이터 생성
- Android Studio → Tools → Device Manager
- Create Device → Pixel 5 선택
- 시스템 이미지 다운로드 (API 34 권장)
- Finish → ▶️ 버튼으로 에뮬레이터 시작

### 3️⃣ 앱 실행
```powershell
# 터미널 1: 백엔드
npm run dev:backend

# 터미널 2: 앱 빌드 & 실행
npm run android:run
```

Android Studio에서 **Pixel 5** 선택 → **▶️ Run** 클릭!

---

## 🔥 실시간 개발 모드 (코드 수정 즉시 반영)

### 1단계: capacitor.config.ts 수정
```typescript
// frontend/capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.roamom.app',
  appName: '해루질가자',
  webDir: 'build',
  server: {
    url: 'http://10.0.2.2:3000',  // 에뮬레이터용 localhost
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};
```

### 2단계: 개발 서버 시작
```powershell
npm run dev  # 백엔드 + 프론트엔드
```

### 3단계: 앱 설치
```powershell
npm run android:run
```

이제 코드 수정하면 에뮬레이터에서 자동 새로고침! 🚀

---

## 💡 에뮬레이터 핵심 팁

| 항목 | 내용 |
|------|------|
| **localhost 접근** | `10.0.2.2` 사용 (에뮬레이터의 특별한 IP) |
| **Chrome 디버깅** | `chrome://inspect` 접속 → Inspect |
| **빠른 부팅** | 에뮬레이터 첫 부팅 후 스냅샷 저장 |
| **로그 보기** | Android Studio → Logcat |
| **명령어 로그** | `npm run android:logs` |

---

## ⚠️ 자주 발생하는 문제

### 에뮬레이터가 느림
→ AVD Manager → Edit → RAM 2048MB 이상, Graphics: Hardware

### 앱이 백엔드 연결 안 됨
→ `10.0.2.2:3002` 사용 확인 (localhost 아님!)

### Hot Reload 안 됨
→ capacitor.config.ts의 server.url 확인

---

## 📋 전체 명령어

```powershell
# 백엔드만
npm run dev:backend

# 프론트엔드만
npm run dev:frontend

# 둘 다 (동시)
npm run dev

# 빌드 & 에뮬레이터 실행
npm run android:run

# 빌드만
npm run android:build

# Android Studio만 열기
npm run android:open

# 에뮬레이터 확인
npm run android:devices

# 로그 보기
npm run android:logs
```

성공! 🎉
