# 📱 Pixel 5에서 앱 테스트하기

## 준비 사항

### 1️⃣ Pixel 5 설정
1. **개발자 옵션 활성화**
   - 설정 → 휴대전화 정보 → 빌드 번호를 7번 탭
   
2. **USB 디버깅 활성화**
   - 설정 → 시스템 → 개발자 옵션 → USB 디버깅 ON

3. **USB로 PC 연결**
   - USB 케이블로 연결
   - "USB 디버깅 허용" 팝업에서 허용

### 2️⃣ Android Studio 또는 ADB 설치 확인
```powershell
# ADB 설치 확인
adb version

# 없으면 Android Studio 설치 또는 platform-tools 다운로드
# https://developer.android.com/studio/releases/platform-tools
```

---

## 🚀 빠른 테스트 (방법 1: USB 연결)

### 1단계: 백엔드 시작
```powershell
cd C:\Users\kj\sea-weather-app
npm run dev:backend
```

### 2단계: 프론트엔드 빌드 & 동기화
```powershell
# 새 터미널에서
cd C:\Users\kj\sea-weather-app\frontend

# 빌드
npm run build

# Capacitor 동기화
npx cap sync android

# Android Studio로 열기
npx cap open android
```

### 3단계: Android Studio에서 실행
1. Android Studio가 열리면
2. 상단에서 디바이스 선택: **Pixel 5**
3. ▶️ Run 버튼 클릭

**또는 명령줄로 직접 실행:**
```powershell
# 앱 빌드 및 설치
cd android
.\gradlew installDebug

# 또는 직접 실행
.\gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🌐 실시간 개발 (방법 2: 네트워크 연동)

Pixel 5와 PC가 같은 WiFi에 있다면 실시간 개발 가능!

### 1단계: PC의 로컬 IP 확인
```powershell
ipconfig
# WiFi의 IPv4 주소 찾기 (예: 192.168.0.10)
```

### 2단계: capacitor.config.ts 수정
```typescript
const config: CapacitorConfig = {
  appId: 'com.roamom.app',
  appName: '해루질가자',
  webDir: 'build',
  server: {
    url: 'http://192.168.0.10:3000',  // PC의 로컬 IP
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};
```

### 3단계: 개발 서버 실행
```powershell
# 백엔드 (3002 포트)
npm run dev:backend

# 프론트엔드 (3000 포트)
cd frontend
npm start
```

### 4단계: 앱에서 확인
- 코드 변경하면 앱에서 즉시 반영! 🔥
- Hot reload 가능

---

## 🎯 프로덕션 APK 빌드

Play Store 업로드용 또는 최종 테스트용:

```powershell
cd C:\Users\kj\sea-weather-app\frontend

# 1. 프론트엔드 빌드
npm run build

# 2. Capacitor 동기화
npx cap sync android

# 3. Release APK 빌드
cd android
.\gradlew assembleRelease

# APK 위치:
# android/app/build/outputs/apk/release/app-release.apk
```

**서명된 APK (Play Store 업로드용):**
```powershell
.\gradlew bundleRelease

# AAB 위치:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🐛 디버깅 팁

### 로그 확인 (실시간)
```powershell
# 앱 로그 실시간 확인
adb logcat | Select-String "Capacitor|ReactNative|chromium"

# 또는 특정 앱만
adb logcat | Select-String "com.roamom.app"
```

### Chrome DevTools 사용
1. Chrome에서 `chrome://inspect` 접속
2. Pixel 5에서 실행 중인 앱 선택
3. **Inspect** 클릭
4. 웹처럼 디버깅 가능! 🎉

### 연결된 디바이스 확인
```powershell
adb devices

# 출력 예:
# List of devices attached
# 1234567890ABCDEF    device
```

---

## ⚠️ 문제 해결

### 디바이스가 인식 안 됨
```powershell
# ADB 서버 재시작
adb kill-server
adb start-server
adb devices
```

### 빌드 에러
```powershell
# Gradle 캐시 삭제
cd android
.\gradlew clean

# node_modules 재설치
cd ..
Remove-Item -Recurse -Force node_modules
npm install
```

### 앱이 백엔드에 연결 안 됨
- 방화벽 확인 (3002 포트 허용)
- Pixel 5와 PC가 같은 WiFi인지 확인
- 백엔드 URL이 올바른지 확인

---

## 📋 빠른 명령어 모음

```powershell
# 풀 사이클 (빌드 → 동기화 → 실행)
cd C:\Users\kj\sea-weather-app\frontend
npm run build && npx cap sync android && npx cap open android

# 개발 모드 (실시간 변경)
npm run dev  # 루트에서

# 디바이스에 직접 설치
cd android && .\gradlew installDebug

# 로그 보기
adb logcat
```

---

## ✅ 체크리스트

개발 전:
- [ ] Pixel 5 USB 디버깅 활성화
- [ ] USB 케이블로 PC 연결
- [ ] `adb devices`로 연결 확인

빌드 전:
- [ ] Backend 실행 중 (`npm run dev:backend`)
- [ ] Frontend 빌드 완료 (`npm run build`)
- [ ] Capacitor 동기화 (`npx cap sync android`)

배포 전:
- [ ] Release APK 빌드 성공
- [ ] 실제 디바이스에서 테스트 완료
- [ ] 네트워크 없이 동작 확인
