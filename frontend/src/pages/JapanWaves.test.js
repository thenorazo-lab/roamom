import { render, screen } from '@testing-library/react';
import React from 'react';
import JapanWaves from './JapanWaves';

// Mock axios to return empty images so component uses placeholder
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { images: [] } }))
}));

test('빈 응답 시에도 시간대별 플레이스홀더 이미지가 표시된다', async () => {
  render(<JapanWaves />);
  // 캡션과 타이틀 존재 확인
  expect(await screen.findByText('일본 파고 (타임시리즈)')).toBeInTheDocument();
  expect(await screen.findByText('ICOM 일본기상청 데이터')).toBeInTheDocument();

  // 이미지가 최소 1개 이상 표시되어야 함 (메인 이미지)
  const imgs = await screen.findAllByRole('img');
  expect(imgs.length).toBeGreaterThan(0);
  // 플레이스홀더 도메인 사용 여부 (메인 또는 썸네일 중 하나)
  const anyPlaceholder = imgs.some(img => (img.getAttribute('src') || '').includes('placehold.co'));
  expect(anyPlaceholder).toBe(true);
});
