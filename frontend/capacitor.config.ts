import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roamom.app',
  appName: '해루질가자',
  webDir: 'build',
  server: {
    // 개발 시 localhost 백엔드 사용
    // 프로덕션에서는 환경변수 REACT_APP_API_URL 사용
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
