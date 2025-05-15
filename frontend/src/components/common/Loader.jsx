import React from 'react';
import '../../styles/loader.css';

const Loader = ({ size = 'md', text = 'Loading...' }) => {
  return (
    <div className="loader-container">
      <div className={`loader loader-${size}`}></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;