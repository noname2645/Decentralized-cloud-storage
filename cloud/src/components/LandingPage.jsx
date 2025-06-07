import React, { useEffect, useState } from 'react';
import { Shield, Database, Lock, Network, Globe, ArrowRight, Check, Star } from 'lucide-react';
import "../stylesheets/LandingPage.css";
import { Link } from 'react-router-dom';

const BlockchainLandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

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

  const testimonials = [
    {
      name: "Alex Chen",
      role: "CTO, TechFlow",
      quote: "The security and reliability of this decentralized storage solution exceeded our expectations. Our data has never been safer.",
      rating: 5
    },
    {
      name: "Sarah Mitchell",
      role: "Lead Developer, DataSync",
      quote: "Seamless integration with our existing infrastructure. The blockchain verification gives us complete confidence in data integrity.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Security Architect, CyberGuard",
      quote: "Finally, a storage solution that doesn't compromise on security or performance. The decentralized approach is revolutionary.",
      rating: 5
    }
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
            <a href="#features" className="nav-link">Features</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#docs" className="nav-link">Docs</a>
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
                <a href="#case-study" className="primary-btn">
                  <span>View Case Study</span>
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
                <div className="visual-card">
                  <div className="visual-grid">
                    {[...Array(9)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`visual-block visual-block-${i % 3}`}
                        style={{animationDelay: `${i * 0.2}s`}}
                      ></div>
                    ))}
                  </div>
                  <div className="visual-status">
                    <div className="status-item">
                      <div className="status-dot status-green"></div>
                      <span className="status-text">Blockchain Network Active</span>
                    </div>
                    <div className="status-item">
                      <div className="status-dot status-blue"></div>
                      <span className="status-text">IPFS Nodes Synchronized</span>
                    </div>
                    <div className="status-item">
                      <div className="status-dot status-purple"></div>
                      <span className="status-text">Data Encrypted & Distributed</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="visual-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
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

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="section-header">
            <h2 className="section-title testimonials-title">
              Trusted by Industry Leaders
            </h2>
            <p className="section-description">See what our clients say about our blockchain storage solution</p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="star-icon" />
                  ))}
                </div>
                <p className="testimonial-quote">"{testimonial.quote}"</p>
                <div className="testimonial-author">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}</div>
                </div>
              </div>
            ))}
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