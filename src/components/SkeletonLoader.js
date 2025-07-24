import React from 'react';
import './SkeletonLoader.css';

function SkeletonLoader() {
  return (
    <div className="skeleton-container">
      <div className="loader">
        <div className="cell d-0"></div>
        <div className="cell d-1"></div>
        <div className="cell d-2"></div>
        <div className="cell d-1"></div>
        <div className="cell d-2"></div>
        <div className="cell d-2"></div>
        <div className="cell d-3"></div>
        <div className="cell d-3"></div>
        <div className="cell d-4"></div>
      </div>
      
      <div className="loading-text">
        Yükleniyor...
      </div>
    </div>
  );
}

export default SkeletonLoader;
