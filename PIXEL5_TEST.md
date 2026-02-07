# 🚀 Pixel 5 테스트 빠른 시작 가이드

## 1️⃣ ADB 설치 (최초 1회만)

### 방법 A: Android Studio 설치 (권장)
1. [Android Studio 다운로드](https://developer.android.com/studio)
2. 설치 후 SDK Manager에서 "Android SDK Platform-Tools" 설치
3. 환경 변수 자동 설정됨

### 방법 B: Platform Tools만 설치 (빠름)
1. [Platform Tools 다운로드](https://developer.android.com/studio/releases/platform-tools)
2. 압축 해제 (예: `C:\platform-tools`)
3. 환경 변수 PATH에 추가:
   ```powershell
   # PowerShell 관리자 권한으로 실행
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\platform-tools", "User")
   ```
4. 터미널 재시작

### 설치 확인
```powershell
adb version
# Android Debug Bridge version 1.0.41 같은 메시지가 나오면 성공!
```

---

## 2️⃣ Pixel 5 준비

1. **개발자 옵션 활성화**
   - 설정 → 휴대전화 정보 → 빌드 번호를 **7번** 연속 탭
   - "개발자가 되었습니다!" 메시지 확인

2. **USB 디버깅 활성화**
   - 설정 → 시스템 → 개발자 옵션
   - **USB 디버깅** ON

3. **USB 케이블로 PC 연결**
   - Pixel 5를 USB로 PC에 연결
   - "USB 디버깅 허용하시겠습니까?" 팝업에서 **허용** 탭

4. **연결 확인**
   ```powershell
   npm run android:devices
   
   # 출력 예시:
   # List of devices attached
   # 1A2B3C4D5E6F    device
   ```

---

## 3️⃣ 앱 실행하기 (3가지 방법)

### ⚡ 방법 1: 한 번에 빌드 & 실행 (가장 쉬움)
```powershell
cd C:\Users\kj\sea-weather-app

# 백엔드 시작
npm run dev:backend

# 새 터미널에서 - 빌드 & Android Studio 열기
npm run android:run
```
→ Android Studio가 열리면 ▶️ Run 버튼 클릭!

---

### 🔄 방법 2: 실시간 개발 모드
같은 WiFi에서 코드 변경이 앱에 즉시 반영됨!

**1단계: PC의 IP 확인**
```powershell
ipconfig | Select-String "IPv4"
# 예: 192.168.0.10
```

**2단계: frontend/capacitor.config.ts 수정**
```typescript
const config: CapacitorConfig = {
  appId: 'com.roamom.app',
  appName: '해루질가자',
  webDir: 'build',
  server: {
    url: 'http://192.168.0.10:3000',  // ← 여기에 PC의 IP
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};
```

**3단계: 개발 서버 실행**
```powershell
# 루트에서
npm run dev

# 또는 따로 실행
npm run dev:backend  # 터미널 1
npm run dev:frontend # 터미널 2
```

**4단계: 앱 빌드 & 설치**
```powershell
npm run android:run
```

→ 이제 코드 수정하면 Pixel 5에서 자동 새로고침! 🔥

---

### 📦 방법 3: 프로덕션 APK 빌드
```powershell
cd C:\Users\kj\sea-weather-app\frontend

# 빌드
npm run build

# 동기화
npx cap sync android

# Release APK 생성
cd android
.\gradlew assembleRelease

# APK 위치
# android\app\build\outputs\apk\release\app-release.apk
```

---

## 4️⃣ 디버깅하기

### Chrome DevTools로 디버깅 (웹처럼!)
1. Pixel 5에서 앱 실행
2. PC의 Chrome에서 `chrome://inspect` 접속
3. 디바이스 목록에서 앱 찾기
4. **Inspect** 클릭
5. Console, Network, Elements 탭 모두 사용 가능! 🎉

### 로그 실시간 보기
```powershell
npm run android:logs
```

---

## 🎯 빠른 명령어 요약

```powershell
# 디바이스 연결 확인
npm run android:devices

# 빌드 & Android Studio 열기
npm run android:run

# 빌드만
npm run android:build

# Android Studio만 열기
npm run android:open

# 로그 보기
npm run android:logs
```

---

## ⚠️ 문제 해결

### "adb: command not found"
→ ADB 설치 필요 (위의 1️⃣ 참고)

### "no devices/emulators found"
```powershell
# USB 디버깅이 켜져있는지 확인
# ADB 재시작
adb kill-server
adb start-server
adb devices
```

### 앱이 백엔드에 연결 안 됨
1. 백엔드가 실행 중인지 확인 (`npm run dev:backend`)
2. 방화벽에서 3002 포트 허용
3. Pixel 5와 PC가 같은 WiFi인지 확인

### 빌드 에러
```powershell
# 클린 빌드
cd frontend\android
.\gradlew clean
cd ..\..
npm run android:build
```

---

## ✅ 시작 체크리스트

- [ ] ADB 설치 완료 (`adb version` 확인)
- [ ] Pixel 5 USB 디버깅 활성화
- [ ] USB 케이블로 PC 연결
- [ ] `npm run android:devices`로 연결 확인
- [ ] 백엔드 실행 (`npm run dev:backend`)
- [ ] `npm run android:run` 실행

**성공하면 Pixel 5에서 앱이 실행됩니다! 🎉**

---

## 💡 팁

- **처음 빌드는 시간이 걸려요** (5-10분) - 커피 한 잔! ☕
- **두 번째부터는 빠릅니다** (1-2분)
- **실시간 개발 모드**를 사용하면 가장 빠르게 테스트할 수 있어요
- **Chrome DevTools**로 웹처럼 디버깅하세요
- **에뮬레이터 스냅샷**: 첫 부팅 후 상태 저장하면 다음부터 빠르게 시작!
- **localhost는 `10.0.2.2`**: 에뮬레이터에서 PC의 localhost 접근
- **Ctrl + M**: 에뮬레이터 메뉴 (화면 회전, 위치 변경 등)
- **실제 기기 테스트도 추천**: Play Store 출시 전 꼭 실제 기기에서도 테스트하세요!

---

## 🚀 빠른 시작 (요약)

```powershell
# 1. 백엔드 시작
npm run dev:backend

# 2. 새 터미널 - 앱 빌드 & 실행
npm run android:run

# 3. Android Studio에서
#    - Pixel 5 에뮬레이터 선택
#    - ▶️ Run 클릭
#    - 완료! 🎉
```
