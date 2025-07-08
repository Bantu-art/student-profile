import React from 'react';
import '../styles/Loading.css';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner-large">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <h2>Zone01 Kisumu</h2>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Loading;
