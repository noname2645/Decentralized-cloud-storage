import React from "react";
import { useState, useEffect } from "react";
import "../stylesheets/Features.css";

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in effect on load
    setIsVisible(true);
  }, []);

  return (
    <div className="features-container">
      {/* Background blobs */}
      <div className="backgroundBlobs">
        <div className="blob pink"></div>
        <div className="blob green"></div>
        <div className="blob yellow"></div>
        <div className="blob blue"></div>
        <div className="blob purple"></div>
        <div className="blob red"></div>
        <div className="blob teal"></div>
      </div>

      {/* Content container */}
      <div className={`content-wrapper ${isVisible ? 'visible' : 'hidden'}`}>
        <h1 className="main-title">
          Decentralized Cloud Storage
        </h1>

        <div className="features-grid">
          <Feature 
            title="PRIVATE IPFS STORAGE" 
            description="Store your files securely on the InterPlanetary File System (IPFS) with enhanced privacy controls. All data is distributed across the network while remaining accessible only to authorized users." 
          />

          <Feature 
            title="IPFS" 
            description="Leverage the power of the InterPlanetary File System, a peer-to-peer hypermedia protocol designed to make the web faster, safer, and more open. Content-addressing ensures file integrity and eliminates duplication." 
          />

          <Feature 
            title="END-TO-END ENCRYPTION" 
            description="Your files are encrypted before leaving your device and can only be decrypted by those with proper permissions. Not even the storage providers can access your unencrypted data." 
          />

          <Feature 
            title="ACCESS CONTROL" 
            description="Define granular permissions for who can view, edit, or share your files. Cryptographically enforce access rights at the protocol level, not just as a service feature." 
          />

          <Feature 
            title="PEER-TO-PEER UPLOADS" 
            description="Transfer files directly between devices, eliminating central servers as bottlenecks. Share large files efficiently with distributed bandwidth usage across the network."
          />
          
          <Feature 
            title="BLOCKCHAIN INTEGRATION" 
            description="File metadata and access permissions are anchored to blockchain networks, providing immutable records of ownership and an auditable history of file modifications." 
          />
          
          <Feature 
            title="PERMANENT FILE HOSTING" 
            description="Once stored on the network, files can persist indefinitely without centralized hosting services. Data availability is maintained through network incentives rather than subscription payments." 
          />
        </div>
      </div>
    </div>
  );
}

function Feature({ title, description }) {
  return (
    <div className="feature-card">
      <h2 className="feature-title">{title}</h2>
      <p className="feature-description">{description}</p>
    </div>
  );
}
