import { render, screen } from '@testing-library/react';
import App from './App';

// Use manual mock from src/__mocks__
jest.mock('react-router-dom');
// Stub MapComponent to avoid importing ESM react-leaflet in tests
jest.mock('./components/MapComponent', () => () => {
  const React = require('react');
  return React.createElement('div', null, 'Map');
});
// Stub pages that import ESM deps (axios etc.)
jest.mock('./pages/PointsAdmin', () => () => {
  const React = require('react');
  return React.createElement('div', null, 'Admin');
});
jest.mock('./pages/JapanWaves', () => () => {
  const React = require('react');
  return React.createElement('div', null, 'Japan');
});

test('해양 정보 에러 라벨은 존재하지 않는다', () => {
  render(<App />);
  // "(데이터 일부 없음)" 라벨이 어디에도 존재하지 않아야 함
  expect(screen.queryByText(/\(데이터 일부 없음\)/)).toBeNull();
});
