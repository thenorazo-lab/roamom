# Backend (sea-weather-app)

이 디렉터리는 "해루질가자" 웹앱의 백엔드입니다. 아래는 초보자를 위한 간단한 실행 가이드입니다.

## 요구사항
- Node.js (LTS 권장)
- npm

## 설치
1. 패키지 설치
   ```bash
   npm install
   ```
2. 개발용으로 `nodemon` 설치 권장
   ```bash
   npm install -D nodemon
   ```

## 환경변수 (.env)
루트에 `.env` 파일을 생성하고 아래 키들을 설정하세요.

```
DATA_GO_KR_API_KEY=여기에_공공데이터_키
KHOA_API_KEY=여기에_바다누리_조석키
GOOGLE_SERVICE_ACCOUNT_JSON_PATH=path/to/service-account.json (선택)
```

> 주의: 서비스 계정 JSON 키 파일과 `.env`는 절대 Git에 커밋하지 마세요.

## 실행
- 개발 서버 (라이브 리로드):
  ```bash
  npm run dev
  ```
- 프로덕션(간단 실행):
  ```bash
  npm start
  ```

## API
- GET /api/sea-info?lat={latitude}&lon={longitude}
  - 통합 결과(날씨, 파고, 수온, 조석예보 등)를 반환합니다.

## 도움말
문제가 생기면 터미널 출력과 `.env` 설정을 먼저 확인해 주세요. 추가로 원하시면 제가 로컬에서 테스트 가능한 간단한 스크립트도 만들어 드리겠습니다.

## Windows PowerShell에서 백그라운드 작업(개발 서버) 관리 🔧
개발 중 `Start-Job`으로 백그라운드에서 서버를 띄웠다면 아래 명령으로 상태를 확인하고 정리할 수 있습니다.

- 실행 중인 백그라운드 작업 확인:

```powershell
Get-Job
```

- 특정 작업 멈추기(예: Id가 1인 작업):

```powershell
Stop-Job -Id 1
Remove-Job -Id 1
```

- 백엔드가 실행되는 node 프로세스(예: `server.js`)를 찾고 종료하려면:

```powershell
# server.js를 포함하는 프로세스(명령줄) 보여주기
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'server.js' } | Select-Object ProcessId, CommandLine

# 찾은 프로세스(예: 12345)를 강제 종료
Stop-Process -Id 12345 -Force
```

- 서버가 정상적으로 내려갔는지 확인하려면 (예: 포트 3002):

```powershell
curl.exe http://127.0.0.1:3002/api/health -i
# 연결 실패(Could not connect)는 서버가 내려갔음을 의미합니다.
```

> 주의: `Stop-Process`는 다른 작업에 영향을 줄 수 있으니, 정확한 PID인지 확인한 뒤 사용하세요.
