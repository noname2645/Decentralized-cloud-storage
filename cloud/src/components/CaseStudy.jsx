import React from "react";
import { useState, useEffect } from "react";
import "../stylesheets/CaseStudy.css";

export default function CaseStudy() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("introduction");

  useEffect(() => {
    // Fade in effect on load
    setIsVisible(true);
  }, []);

  // Function to handle navigation
  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="case-study-container">
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
      <div className={`case-study-content-wrapper ${isVisible ? 'visible' : 'hidden'}`}>
        <h1 className="case-study-title">
          Decentralized Cloud Storage: A Blockchain-Based Paradigm Shift
        </h1>

        {/* Navigation Sidebar */}
        <div className="case-study-layout">
          <aside className="case-study-nav">
            <nav>
              <ul>
                <li className={activeSection === "introduction" ? "active" : ""}>
                  <button onClick={() => navigateToSection("introduction")}>1. Introduction</button>
                  <ul className="sub-nav">
                    <li><button onClick={() => navigateToSection("background")}>1.1 Project Background</button></li>
                    <li><button onClick={() => navigateToSection("motivation")}>1.2 Motivation</button></li>
                    <li><button onClick={() => navigateToSection("problem")}>1.3 Problem Statement</button></li>
                    <li><button onClick={() => navigateToSection("aims")}>1.4 Aims and Objectives</button></li>
                    <li><button onClick={() => navigateToSection("organization")}>1.5 Report Organization</button></li>
                  </ul>
                </li>
                <li className={activeSection === "literature" ? "active" : ""}>
                  <button onClick={() => navigateToSection("literature")}>2. Review of Literature</button>
                  <ul className="sub-nav">
                    <li><button onClick={() => navigateToSection("related-work")}>2.1 Related Work</button></li>
                    <li><button onClick={() => navigateToSection("comparison")}>2.2 Comparative Analysis</button></li>
                    <li><button onClick={() => navigateToSection("limitations")}>2.3 Limitations</button></li>
                  </ul>
                </li>
                <li className={activeSection === "system-analysis" ? "active" : ""}>
                  <button onClick={() => navigateToSection("system-analysis")}>3. System Analysis and Design</button>
                  <ul className="sub-nav">
                    <li><button onClick={() => navigateToSection("requirements")}>3.1 Requirements</button></li>
                    <li><button onClick={() => navigateToSection("feasibility")}>3.2 Feasibility Study</button></li>
                  </ul>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="case-study-main">
            <section id="introduction" className="case-study-section">
              <h2>1. Introduction</h2>
              
              <div id="background" className="sub-section">
                <h3>1.1 Project Background</h3>
                <p>
                  In the digital age, cloud storage has become vital for individuals and organizations to manage increasing volumes of data. 
                  Traditional storage services like AWS, Google Cloud, and Dropbox rely on centralized data centers, posing issues related 
                  to privacy, control, security, and single points of failure.
                </p>
              </div>
              
              <div id="motivation" className="sub-section">
                <h3>1.2 Motivation</h3>
                <p>
                  The rise of data breaches, unauthorized access, and service outages have intensified the need for secure and private data 
                  storage solutions. Centralized control by tech giants introduces ethical and practical concerns. Decentralized cloud storage 
                  offers a user-centric model using blockchain, P2P networking, and encryption to return control to users and improve resilience.
                </p>
              </div>
              
              <div id="problem" className="sub-section">
                <h3>1.3 Statement of the Problem</h3>
                <p>Current centralized systems suffer from:</p>
                <ul>
                  <li>Data privacy breaches</li>
                  <li>Single points of failure</li>
                  <li>Limited user control</li>
                  <li>High storage costs</li>
                  <li>Censorship issues</li>
                </ul>
              </div>
              
              <div id="aims" className="sub-section">
                <h3>1.4 Aims and Objectives</h3>
                <h4>Aims:</h4>
                <ul>
                  <li>Design a secure, reliable, and cost-effective decentralized storage system</li>
                  <li>Use blockchain and P2P for a trustless ecosystem</li>
                  <li>Maximize data security and user sovereignty</li>
                </ul>
                
                <h4>Objectives:</h4>
                <ul>
                  <li>Analyze existing platforms (IPFS, Filecoin, etc.)</li>
                  <li>Architect a system with encryption and chunk distribution</li>
                  <li>Prototype a decentralized upload/download interface</li>
                </ul>
              </div>
              
              <div id="organization" className="sub-section">
                <h3>1.5 Report Organization</h3>
                <p>Chapters 1-10 detail background, review, design, implementation, testing, and future work.</p>
              </div>
            </section>

            <section id="literature" className="case-study-section">
              <h2>2. Review of Literature</h2>
              
              <div id="related-work" className="sub-section">
                <h3>2.1 Related Work</h3>
                <ul className="feature-list">
                  <li><strong>IPFS:</strong> Content-addressed, P2P file system.</li>
                  <li><strong>Filecoin:</strong> Adds economic incentives with blockchain proofs.</li>
                  <li><strong>Storj:</strong> Decentralized, encrypted object storage with high performance.</li>
                  <li><strong>Sia:</strong> Smart contract-based storage rental with blockchain.</li>
                  <li><strong>Swarm:</strong> Ethereum-native decentralized storage, still in development.</li>
                </ul>
              </div>
              
              <div id="comparison" className="sub-section">
                <h3>2.2 Comparative Analysis</h3>
                <div className="table-container">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>IPFS</th>
                        <th>Filecoin</th>
                        <th>Sia</th>
                        <th>Storj</th>
                        <th>Swarm</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Storage Type</td>
                        <td>Content-addressed</td>
                        <td>Incentivized</td>
                        <td>Cloud storage</td>
                        <td>Object storage</td>
                        <td>Ethereum-based</td>
                      </tr>
                      <tr>
                        <td>Blockchain Use</td>
                        <td>No</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Partial</td>
                        <td>Yes</td>
                      </tr>
                      <tr>
                        <td>Incentives</td>
                        <td>No</td>
                        <td>FIL token</td>
                        <td>SIA token</td>
                        <td>STORJ token</td>
                        <td>BZZ token</td>
                      </tr>
                      <tr>
                        <td>Encryption</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Yes</td>
                      </tr>
                      <tr>
                        <td>Redundancy</td>
                        <td>Optional</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Yes</td>
                      </tr>
                      <tr>
                        <td>Smart Contracts</td>
                        <td>No</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>No</td>
                        <td>Yes</td>
                      </tr>
                      <tr>
                        <td>Ease of Use</td>
                        <td>Medium</td>
                        <td>Low</td>
                        <td>Medium</td>
                        <td>High</td>
                        <td>Low</td>
                      </tr>
                      <tr>
                        <td>Performance</td>
                        <td>Moderate</td>
                        <td>Moderate</td>
                        <td>Moderate</td>
                        <td>High</td>
                        <td>Low</td>
                      </tr>
                      <tr>
                        <td>Maturity</td>
                        <td>High</td>
                        <td>Moderate</td>
                        <td>Moderate</td>
                        <td>Moderate</td>
                        <td>Low</td>
                      </tr>
                      <tr>
                        <td>Open Source</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Yes</td>
                        <td>Yes</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div id="limitations" className="sub-section">
                <h3>2.3 Limitations</h3>
                <ul className="feature-list">
                  <li><strong>Usability:</strong> Technical barriers, poor UI</li>
                  <li><strong>Performance:</strong> High latency, inefficient routing</li>
                  <li><strong>Persistence:</strong> Unreliable data longevity</li>
                  <li><strong>Incentives:</strong> Weak models, token volatility</li>
                  <li><strong>Security:</strong> User-dependent key management, weak access control</li>
                </ul>
              </div>
            </section>

            <section id="system-analysis" className="case-study-section">
              <h2>3. System Analysis and Design</h2>
              
              <div id="requirements" className="sub-section">
                <h3>3.1 Requirements</h3>
                
                <div className="requirement-group">
                  <h4>3.1.1 Functional:</h4>
                  <ul>
                    <li>User registration via wallets (MetaMask)</li>
                    <li>Client-side encryption during file uploads</li>
                    <li>Decentralized file retrieval and reconstruction</li>
                    <li>File management: view, rename, delete, versioning</li>
                  </ul>
                </div>
                
                <div className="requirement-group">
                  <h4>3.1.2 Non-Functional:</h4>
                  <ul>
                    <li>Performance: Optimized latency via node caching</li>
                    <li>Scalability: Horizontal expansion</li>
                    <li>Security: End-to-end encryption, TLS/SSL, hash verification</li>
                  </ul>
                </div>
                
                <div className="requirement-group">
                  <h4>3.1.3 Hardware & Software:</h4>
                  
                  <div className="specs-container">
                    <div className="specs-card">
                      <h5>Hardware</h5>
                      <div className="specs-section">
                        <h6>Minimum:</h6>
                        <ul>
                          <li>Dual-core 2.4GHz</li>
                          <li>4GB RAM</li>
                          <li>2GB storage</li>
                          <li>3mbps internet</li>
                        </ul>
                      </div>
                      <div className="specs-section">
                        <h6>Recommended:</h6>
                        <ul>
                          <li>Quad-core 2.8GHz</li>
                          <li>8GB RAM</li>
                          <li>4GB storage</li>
                          <li>6mbps internet</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="specs-card">
                      <h5>Software</h5>
                      <div className="specs-section">
                        <h6>Minimum:</h6>
                        <ul>
                          <li>Windows 10</li>
                          <li>Java 3.11 with necessary modules</li>
                        </ul>
                      </div>
                      <div className="specs-section">
                        <h6>Recommended:</h6>
                        <ul>
                          <li>Windows 11</li>
                          <li>Java 3.12 with modules</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div id="feasibility" className="sub-section">
                <h3>3.2 Feasibility Study</h3>
                <h4>3.2.1 Technical Feasibility:</h4>
                <ul>
                  <li>IPFS, Libp2p, WebRTC for P2P</li>
                  <li>Ethereum, Polygon, BNB for smart contracts</li>
                  <li>Proven technologies make implementation viable</li>
                </ul>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
