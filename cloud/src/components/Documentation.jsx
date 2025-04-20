import React from "react";
import { useState, useEffect } from "react";
import "../stylesheets/Documentation.css";

export default function Documentation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in effect on load
    setIsVisible(true);
  }, []);

  return (
    <div className="documentation-container">
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
      <div className={`doc-content-wrapper ${isVisible ? 'visible' : 'hidden'}`}>
        <h1 className="doc-main-title">
          Project Documentation
        </h1>

        <div className="doc-content">
          <section className="doc-section">
            <h2 className="doc-section-title">Introduction</h2>
            <p className="doc-text">
              Welcome to the comprehensive documentation for our Decentralized Cloud Storage solution. This documentation provides detailed information about the system architecture, implementation details, usage guidelines, and best practices.
            </p>
          </section>

          <section className="doc-section">
            <h2 className="doc-section-title">System Overview</h2>
            <p className="doc-text">
              Our decentralized storage platform leverages IPFS (InterPlanetary File System) technology combined with blockchain-based access control to provide secure, distributed file storage. The system eliminates single points of failure while maintaining data integrity and availability.
            </p>
            <p className="doc-text">
              Unlike traditional cloud storage services, our platform distributes your data across multiple nodes in the network, ensuring that no single entity has complete control over your information. This architecture provides enhanced privacy, resilience against outages, and permanent data storage options.
            </p>
          </section>

          <section className="doc-section">
            <h2 className="doc-section-title">Technical Architecture</h2>
            <p className="doc-text">
              The platform consists of several key components:
            </p>
            <ul className="doc-list">
              <li className="doc-list-item">
                <span className="doc-list-title">IPFS Node Network:</span> Distributed network of nodes that store and retrieve content using content-addressing.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">Encryption Layer:</span> Client-side encryption ensuring data confidentiality before uploading to the network.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">Access Control Smart Contracts:</span> Blockchain-based contracts that manage permissions and access rights.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">P2P Transfer Protocol:</span> Efficient peer-to-peer file transfer mechanism to optimize upload and download speeds.
              </li>
            </ul>
          </section>

          <section className="doc-section">
            <h2 className="doc-section-title">Implementation Guidelines</h2>
            <p className="doc-text">
              This section provides detailed information about implementing our decentralized storage solution within your applications or services.
            </p>
            <p className="doc-text">
              The platform offers multiple integration options including a JavaScript SDK, RESTful API, and command-line interface. Choose the approach that best fits your development environment and requirements.
            </p>
            <p className="doc-text">
              Our API documentation includes comprehensive examples of file uploads, downloads, permission management, and advanced features like content pinning and replication factor control.
            </p>
          </section>

          <section className="doc-section">
            <h2 className="doc-section-title">Security Considerations</h2>
            <p className="doc-text">
              Security is a foundational aspect of our decentralized storage platform. Here are key security principles implemented in our system:
            </p>
            <ul className="doc-list">
              <li className="doc-list-item">
                <span className="doc-list-title">Zero-Knowledge Architecture:</span> The storage provider never has access to unencrypted user data.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">Multi-Factor Authentication:</span> Optional MFA for account access and permission management.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">Encrypted Key Management:</span> Secure handling of encryption keys using industry-standard key derivation functions.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">Audit Trails:</span> Immutable blockchain records of all file access and modification events.
              </li>
            </ul>
          </section>

          <section className="doc-section">
            <h2 className="doc-section-title">Advanced Features</h2>
            <p className="doc-text">
              Our platform includes several advanced features for power users and enterprise deployments:
            </p>
            <ul className="doc-list">
              <li className="doc-list-item">
                <span className="doc-list-title">Content Addressing:</span> Files are identified by their cryptographic hash, ensuring integrity.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">Deduplication:</span> Automatic detection and handling of duplicate files to optimize storage usage.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">Versioning:</span> Track and retrieve previous versions of files with complete history.
              </li>
              <li className="doc-list-item">
                <span className="doc-list-title">Programmable Storage Policies:</span> Define custom rules for data replication, geographic distribution, and persistence.
              </li>
            </ul>
          </section>

          <section className="doc-section">
            <h2 className="doc-section-title">Getting Started</h2>
            <p className="doc-text">
              To begin using our decentralized storage platform:
            </p>
            <ol className="doc-numbered-list">
              <li className="doc-list-item">Create an account and generate your encryption keys</li>
              <li className="doc-list-item">Install the client software or SDK for your platform</li>
              <li className="doc-list-item">Configure your storage preferences and access policies</li>
              <li className="doc-list-item">Start uploading and sharing files with confidence</li>
            </ol>
            <p className="doc-text">
              Refer to our quickstart guide for detailed instructions on each step of the process.
            </p>
          </section>

          {/* Add more sections as needed for your documentation */}
        </div>
      </div>
    </div>
  );
}
