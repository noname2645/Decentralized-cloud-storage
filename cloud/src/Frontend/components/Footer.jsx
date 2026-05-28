import React from 'react';
import { Cloud } from 'lucide-react';
import '../stylesheets/Footer.css';

/**
 * Shared footer shown on every page.
 * Pass variant="light" on the landing/features pages for the lighter background.
 */
const Footer = ({ variant = 'dark' }) => {
  const year = new Date().getFullYear();

  return (
    <footer className={`nebula-footer nebula-footer--${variant}`}>
      {/* Left: brand + version */}
      <div className="nf-left">
        <div className="nf-brand">
          <Cloud size={15} />
          <span className="nf-brand-name">Nebula</span>
        </div>
        <span className="nf-version">v2.0.0</span>
      </div>

      {/* Centre: copyright */}
      <p className="nf-copy">
        © {year} Nebula Vault. All rights reserved.
      </p>

      {/* Right: links */}
      <div className="nf-links">
        <a href="#" className="nf-link">Privacy Policy</a>
        <span className="nf-dot">·</span>
        <a href="#" className="nf-link">Terms of Service</a>
        <span className="nf-dot">·</span>
        <a href="#" className="nf-link">Support</a>
      </div>
    </footer>
  );
};

export default Footer;
