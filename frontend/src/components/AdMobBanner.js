// components/AdMobBanner.js
import React, { useEffect, useState } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export default function AdMobBanner({ adUnitId = 'ca-app-pub-1120357008550196/7531187764' }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 모바일 앱에서만 AdMob 초기화
    if (Capacitor.isNativePlatform()) {
      const initializeAdMob = async () => {
        try {
          await AdMob.initialize({
            requestTrackingAuthorization: true,
            initializeForTesting: false, // 테스트 완료 후 false로 변경
          });
          setIsInitialized(true);
        } catch (error) {
          console.error('AdMob initialization failed:', error);
        }
      };

      initializeAdMob();
    }
  }, []);

  useEffect(() => {
    if (isInitialized && Capacitor.isNativePlatform()) {
      const showBanner = async () => {
        try {
          await AdMob.showBanner({
            adId: adUnitId,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.TOP_CENTER,
            margin: 0,
          });
        } catch (error) {
          console.error('AdMob banner show failed:', error);
        }
      };

      showBanner();

      // 컴포넌트 언마운트 시 배너 숨기기
      return () => {
        AdMob.hideBanner().catch(err => console.error('AdMob hide banner failed:', err));
      };
    }
  }, [isInitialized, adUnitId]);

  // 웹에서는 아무것도 렌더링하지 않음
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  // 네이티브 앱에서도 DOM에 아무것도 렌더링하지 않음 (AdMob이 네이티브로 표시됨)
  return null;
}
