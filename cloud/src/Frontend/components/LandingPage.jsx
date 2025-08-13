import React, { useEffect, useState } from 'react';
import {
  Shield,
  Database,
  Lock,
  Globe,
  ArrowRight,
  Check,
  Star,
  Upload,
  Users,
  Zap,
  Twitter,
  Github,
  Youtube,
  MessageCircle,
  Play,
  Cpu,
  Cloud,
  Server,
  Key,
  BarChart2,
  HardDrive
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../stylesheets/LandingPage.css';
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
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);



const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'AES-256 Encryption',
      description: 'Advanced Encryption Standard with 256-bit keys ensures your data remains secure with cryptographic protection.',
      detail: 'Industry-standard encryption',
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'IPFS Integration',
      description: 'InterPlanetary File System creates a distributed, peer-to-peer network for storing and sharing data across the globe.',
      detail: 'Decentralized file storage',
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: 'Blockchain Security',
      description: 'Currently on ETH Sepolia test network, tamper-proof records with cryptographic verification of all transactions.',
      detail: 'Immutable data integrity',
    },
  ];

  const metrics = [
    {
      icon: <Users className="w-7 h-7" />,
      number: '75K+',
      label: 'Developers',
    },
    {
      icon: <Database className="w-7 h-7" />,
      number: '2.5PB+',
      label: 'Data Secured',
    },
    {
      icon: <Server className="w-7 h-7" />,
      number: '300+',
      label: 'Global Nodes',
    },
    {
      icon: <Zap className="w-7 h-7" />,
      number: '99.999%',
      label: 'Uptime SLA',
    },
  ];

  return (
    <div className="main-container">
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <nav className="nav-container">
          <div className="logo-container">
            <div className="logo-icon">
              <Cloud className="w-6 h-6" />
            </div>
            <span className="logo-text">Nebula</span>
          </div>

          <div className="nav-links">
            <Link to="/features" className="nav-link">
              How this works ?
            </Link>
          </div>

          <div className="nav-buttons">
            <Link to="/login" className="login-link">
              Sign In
            </Link>
            <Link to="/register" className="get-started-btn">
              Register <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="hero-badge"
            >
             
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="hero-title"
            >
              The cloud reimagined for <br />
              <span className="hero-title-gradient">Web3.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="hero-description"
            >
              Nebula combines enterprise-grade infrastructure with blockchain security to deliver the most advanced decentralized storage network.
            </motion.p>

            <div className="hero-buttons">
              <Link to="/register" className="primary-btn">
                <span>Register</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <motion.div
            className="hero-visual floating"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="visual-container dashboard-card">
              <div className="dashboard-header">
                <div className="dashboard-title">
                  <Database className="w-5 h-5" /> Nebula Network Status
                </div>
                <div className="dashboard-status">
                  <div className="status-dot status-active"></div>
                  Dummy Stats
                </div>
              </div>
              <div className="metrics-grid">
                {metrics.map((metric, index) => (
                  <div key={index} className="metric-card">
                    <div className="metric-icon">{metric.icon}</div>
                    <div className="metric-number">{metric.number}</div>
                    <div className="metric-label">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-gradient">Nebula</span> Core Technologies
            </h2>
            <p className="section-description">
              We've reinvented cloud infrastructure from the ground up with breakthrough innovations.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`feature-card ${activeFeature === index ? 'feature-active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="feature-icon-container">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-detail">
                  <span>{feature.detail}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-container">
          <div className="demo-content">
            <h2 className="demo-title">Experience the future of storage</h2>
            <p className="demo-description">
              See how Nebula outperforms traditional cloud providers in security, speed, and reliability.
            </p>
     
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <Cloud className="w-6 h-6" />
                <span className="footer-logo-text">Nebula</span>
              </div>
            </div>
            
            <div className="footer-info">
              <p className="footer-credit">
                Made with ❤️ by students of <span className="team-name">Nebula Team</span>
              </p>
              <div className="footer-details">
                <span className="footer-year">© 2025</span>
                <span className="footer-separator">•</span>
                <span className="footer-project">Decentralized Cloud Storage</span>
                <span className="footer-separator">•</span>
                <span className="footer-version">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlockchainLandingPage;