import React from 'react';
import '../../styles/order-tracker.css';

const OrderTracker = ({ steps, currentStep }) => {
  return (
    <div className="order-tracker">
      <div className="tracker-steps">
        {steps.map((step, index) => {
          // Determine step status
          let stepStatus = 'pending';
          if (index < currentStep) {
            stepStatus = 'completed';
          } else if (index === currentStep) {
            stepStatus = 'current';
          }
          
          return (
            <div key={step.status} className={`tracker-step ${stepStatus}`}>
              <div className="step-connector">
                {index > 0 && (
                  <div className={`connector-line ${index <= currentStep ? 'active' : ''}`}></div>
                )}
                <div className="step-icon">
                  {stepStatus === 'completed' ? (
                    <span>✓</span>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
              </div>
              <div className="step-content">
                <div className="step-label">{step.label}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;