// frontend/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => (
  <div className="container">
    <h1 className="main-title">해루질가자</h1>
    <p className="sub-title">안전하고 즐거운 해루질을 위한 필수 정보</p>
    <div className="nav-buttons">
      <Link to="/weather" className="nav-button">
        바다날씨
      </Link>
      <Link to="/jp-wave" className="nav-button">
        일본파고
      </Link>
      <Link to="/points" className="nav-button">
        포인트 공유
      </Link>
    </div>
  </div>
);

export default HomePage;