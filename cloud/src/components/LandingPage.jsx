import React, { useEffect, useState } from 'react';
import { Shield, Database, Lock, Network, Globe, ArrowRight, Check, Star, Upload, Users, Zap } from 'lucide-react';
import "../stylesheets/LandingPage.css";
import { Link } from 'react-router-dom';

const BlockchainLandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) return 0;
        return prev + Math.random() * 15;
      });
    }, 500);
    return () => clearInterval(progressInterval);
  }, []);

  const features = [
    {
      icon: <Shield className="feature-icon" />,
      title: "Military-Grade Security",
      description: "End-to-end encryption with blockchain immutability ensures your data remains secure and tamper-proof.",
      color: "feature-cyan"
    },
    {
      icon: <Network className="feature-icon" />,
      title: "Decentralized Network",
      description: "Distributed across multiple nodes, eliminating single points of failure and ensuring 99.9% uptime.",
      color: "feature-purple"
    },
    {
      icon: <Database className="feature-icon" />,
      title: "IPFS Integration",
      description: "Leverage the InterPlanetary File System for efficient, content-addressed storage at global scale.",
      color: "feature-green"
    }
  ];

  const benefits = [
    "Zero single point of failure",
    "99.99% data availability",
    "Quantum-resistant encryption",
    "Global edge distribution"
  ];

  return (
    <div className="main-container">
      {/* Animated background elements */}
      <div className="background-container">
        <div className="bg-element bg-element-1"></div>
        <div className="bg-element bg-element-2"></div>
        <div className="bg-element bg-element-3"></div>
      </div>

      {/* Header */}
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <nav className="nav-container">
          <div className="logo-container">
            <div className="logo-icon">
              <Database className="logo-icon-svg" />
            </div>
            <span className="logo-text">DCS</span>
          </div>
          
          <div className="nav-links">
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/aboutus" className="nav-link">About</Link>
            <Link to="/doc" className="nav-link">Docs</Link>
          </div>
          
          <div className="nav-buttons">
            <Link to="/login" className="login-link">Login</Link>
            <Link to="/register" className="get-started-btn">
              Register
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-text">
                <div className="hero-badge">
                  <Globe className="badge-icon" />
                  <span className="badge-text">Powered by Blockchain Technology</span>
                </div>
                <h1 className="hero-title">
                  <span className="hero-title-primary">Decentralized</span>
                  <br />
                  <span className="hero-title-gradient">Cloud Storage</span>
                </h1>
                <p className="hero-description">
                  Secure, scalable, and immutable storage solution built on blockchain technology. 
                  Your data, your control, completely decentralized.
                </p>
              </div>
              
              <div className="hero-buttons">
                <a href="#features" className="primary-btn">
                  <span>Get Started</span>
                  <ArrowRight className="btn-icon" />
                </a>
                <button className="secondary-btn">
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number stat-cyan">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number stat-blue">256-bit</div>
                  <div className="stat-label">Encryption</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number stat-purple">1000+</div>
                  <div className="stat-label">Nodes</div>
                </div>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="visual-container">
                <div className="dashboard-card">
                  <div className="dashboard-header">
                    <div className="dashboard-title">
                      <Database className="dashboard-icon" />
                      <span>Storage Dashboard</span>
                    </div>
                    <div className="dashboard-status">
                      <div className="status-dot status-active"></div>
                      <span>Live</span>
                    </div>
                  </div>
                  
                  <div className="upload-section">
                    <div className="upload-area">
                      <Upload className="upload-icon" />
                      <p className="upload-text">Drop files here or click to upload</p>
                      <div className="upload-progress">
                        <div 
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="upload-status">{Math.round(uploadProgress)}% uploaded</p>
                    </div>
                  </div>

                  <div className="storage-stats">
                    <div className="stat-row">
                      <span className="stat-label">Storage Used</span>
                      <span className="stat-value">2.4 TB / 5 TB</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Files Stored</span>
                      <span className="stat-value">12,847</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Active Nodes</span>
                      <span className="stat-value">247</span>
                    </div>
                  </div>

                  <div className="benefits-list">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="benefit-item">
                        <Check className="check-icon" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="visual-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-primary">Enterprise-Grade</span>
              <br />
              <span className="section-title-gradient">Storage Infrastructure</span>
            </h2>
            <p className="section-description">
              Built for developers and enterprises who demand the highest levels of security, 
              performance, and reliability for their critical data.
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`feature-card ${activeFeature === index ? 'feature-active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`feature-icon-container ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                
                <div className="feature-indicator">
                  <div className={`indicator-dot ${activeFeature === index ? 'indicator-active' : ''}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="metrics-section">
        <div className="metrics-container">
          <div className="metrics-grid">
            <div className="metric-card">
              <Users className="metric-icon metric-cyan" />
              <div className="metric-content">
                <div className="metric-number">50K+</div>
                <div className="metric-label">Active Users</div>
              </div>
            </div>
            <div className="metric-card">
              <Database className="metric-icon metric-purple" />
              <div className="metric-content">
                <div className="metric-number">1PB+</div>
                <div className="metric-label">Data Stored</div>
              </div>
            </div>
            <div className="metric-card">
              <Network className="metric-icon metric-green" />
              <div className="metric-content">
                <div className="metric-number">500+</div>
                <div className="metric-label">Global Nodes</div>
              </div>
            </div>
            <div className="metric-card">
              <Zap className="metric-icon metric-yellow" />
              <div className="metric-content">
                <div className="metric-number">99.99%</div>
                <div className="metric-label">Availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">
                  <Database className="logo-icon-svg" />
                </div>
                <span className="logo-text">DCS</span>
              </div>
              <p className="footer-description">
                Secure, decentralized cloud storage powered by blockchain technology. 
                Your data, your control.
              </p>
              <div className="social-links">
                {['twitter', 'discord', 'github', 'youtube'].map((social) => (
                  <a key={social} href="#" className="social-link">
                    <div className="social-icon">
                      <div className="social-placeholder"></div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            {[
              {
                title: 'Features',
                links: ['Private IPFS Storage', 'End-to-End Encryption', 'Access Control', 'P2P Uploads', 'Blockchain Integration']
              },
              {
                title: 'Resources',
                links: ['Documentation', 'Case Studies', 'API Reference', 'Developer Guide']
              },
              {
                title: 'Company',
                links: ['About Us', 'Careers', 'Contact', 'Privacy Policy']
              }
            ].map((column, index) => (
              <div key={index} className="footer-column">
                <h3 className="footer-column-title">{column.title}</h3>
                <ul className="footer-links">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#features" className="footer-link">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2025 Decentralized Cloud Storage. All rights reserved.
            </p>
            <div className="footer-legal">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                <a key={link} href="#" className="footer-legal-link">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlockchainLandingPage;