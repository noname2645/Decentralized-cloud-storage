import React, { useState, useEffect } from 'react';
import '../stylesheets/Features.css';
import folder from "../assets/Images/folder.png"
import blockchain from "../assets/Images/blockchain.png"
import nodes from "../assets/Images/nodes.png"
import encryption from "../assets/Images/encryption.png"

const DecentralizedStorage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      id: 'upload',
      title: 'File Upload',
      description: 'User selects and uploads files to begin the secure storage process',
      color: '#007AFF',
      details: 'Users can drag and drop or browse to select files from their device. Our system supports all file types with intelligent file validation and preprocessing.'
    },
    {
      id: 'encrypt',
      title: 'AES Encryption',
      description: 'Files are encrypted with AES-256 encryption',
      color: '#34C759',
      details: 'Advanced Encryption Standard (AES) with 256-bit keys ensures your data remains completely secure. Each file gets a unique encryption key for maximum protection.'
    },
    {
      id: 'ipfs',
      title: 'IPFS Upload',
      description: 'Encrypted files are distributed across the global IPFS network',
      color: '#FF9500',
      details: 'The InterPlanetary File System creates redundant copies across multiple nodes worldwide, ensuring your files are always accessible and never lost.'
    },
    {
      id: 'blockchain',
      title: 'Blockchain Recording',
      description: 'File metadata and hash are permanently recorded on blockchain',
      color: '#AF52DE',
      details: 'Immutable blockchain records provide cryptographic proof of your file\'s existence, integrity, and ownership. This creates an unchangeable audit trail.'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
        setIsAnimating(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleStepClick = (index) => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <div className="storage-container">
      <div className="animation-section">
        <div className="flow-visualization">
          <div className="file-flow">
            <div className={`flow-item file-item ${currentStep >= 0 ? 'active' : ''}`}>
              <div className="file-icon">
                <img src={folder} alt="Failed to load"/>
              </div>
              <span>Original File</span>
            </div>
            
            <div className={`flow-arrow ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="arrow-line"></div>
              <div className="arrow-head"></div>
            </div>

            <div className={`flow-item encrypt-item ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="encrypt-icon">
                <img src={encryption} alt="Failed to load"/>
              </div>
              <span>Encrypted</span>
            </div>

            <div className={`flow-arrow ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="arrow-line"></div>
              <div className="arrow-head"></div>
            </div>

            <div className={`flow-item ipfs-item ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="ipfs-icon">
                <img src={nodes} alt="Failed to load"/>
              </div>
              <span>IPFS Network</span>
            </div>

            <div className={`flow-arrow ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="arrow-line"></div>
              <div className="arrow-head"></div>
            </div>

            <div className={`flow-item blockchain-item ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="blockchain-icon">
                <img src={blockchain} alt="Failed to load"/>
              </div>
              <span>Blockchain</span>
            </div>
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

      </div>

      <div className="process-details">
        <div className="current-step-info">
          <div className="step-header">
            <div className="step-icon-large" style={{ color: steps[currentStep].color }}>
              {steps[currentStep].icon}
            </div>
            <div className="step-text">
              <h2 className="step-title-large">{steps[currentStep].title}</h2>
              <p className="step-description-large">{steps[currentStep].description}</p>
            </div>
          </div>
          <div className="step-details">
            <p>{steps[currentStep].details}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecentralizedStorage;