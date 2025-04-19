import React, { useEffect, useState } from 'react';
import styles from '../stylesheets/LandingPage.module.css';

import logoImage from '../assets/Images/logo.png';
import xIcon from '../assets/Images/x-icon.png';
import discordIcon from '../assets/Images/discord-icon.png';
import gateIcon from '../assets/Images/gate-icon.png';
import youtubeIcon from '../assets/Images/youtube-icon.png';

const DecentralizedCloudStorage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backgroundBlobs}>
        <div className={`${styles.blob} ${styles.pink}`}></div>
        <div className={`${styles.blob} ${styles.green}`}></div>
        <div className={`${styles.blob} ${styles.yellow}`}></div>
        <div className={`${styles.blob} ${styles.blue}`}></div>
        <div className={`${styles.blob} ${styles.purple}`}></div>
        <div className={`${styles.blob} ${styles.red}`}></div>
        <div className={`${styles.blob} ${styles.teal}`}></div>
      </div>

      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <nav className={styles.nav}>
          <div className={styles.logo}>DCS</div>
          <ul className={styles.navLinks}>
            <li><a href="/" className={styles.navLink}>Features</a></li>
            <li><a href="/" className={styles.navLink}>About</a></li>
            <li><a href="/" className={styles.navLink}>Docs</a></li>
            <li><a href="/" className={styles.navLink}>Case Studies</a></li>
          </ul>
          <div className={styles.navButtons}>
            <a href="/" className={`${styles.btn} ${styles.getStarted}`}>Get started</a>
          </div>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>DECENTRALIZED CLOUD STORAGE</h1>
          <p className={styles.heroText}>This is a decentralized cloud storage which is safe for storing</p>
          <div className={styles.ctaButtons}>
            <a href="/" className={`${styles.btn} ${styles.primary}`}>Get started</a>
            <a href="/" className={`${styles.btn} ${styles.green}`}>Read docs</a>
            <a href="/" className={`${styles.btn} ${styles.pink}`}>Case Study</a>
            <a href="/" className={`${styles.btn} ${styles.orange}`}>Assistance</a>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src={logoImage} alt="Cloud" />
        </div>
      </section>

      <section className={styles.secondSection}>
        <h2 className={styles.sectionTitle}>POWER TOOLS FOR DEVELOPERS</h2>
        <div className={styles.toolboxSection}>
          {[
            { title: "Card One", description: "This is the first frosty boi." },
            { title: "Card Two", description: "This one brings the chill." },
            { title: "Card Three", description: "Last but drippiest." }
          ].map((card, index) => (
            <div className={styles.card} key={index}>
              <div className={styles.cardTitle}>{card.title}</div>
              <p className={styles.cardText}>{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.testimonialSection}>
        <h2 className={styles.sectionTitle}>What Our Clients Say</h2>
        <div className={styles.testimonialCards}>
          {[
            {
              name: "John Doe",
              quote: "This service is amazing! It completely changed my life and I couldn't be happier with the results. Highly recommend!"
            },
            {
              name: "Jane Smith",
              quote: "Absolutely phenomenal experience. The attention to detail and support are top-notch. Will definitely return for more!"
            },
            {
              name: "Sam Wilson",
              quote: "I was skeptical at first, but the results blew me away. This is the real deal, I can't imagine going back."
            }
          ].map((testimonial, index) => (
            <div className={styles.testimonialCard} key={index}>
              <h3 className={styles.testimonialName}>{testimonial.name}</h3>
              <p className={styles.testimonialQuote}>"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <h2 className={styles.footerTitle}>DCS</h2>
            <p className={styles.footerSubtitle}>CLOUD FILE STORAGE</p>
            <div className={styles.socialIcons}>
              <a href="/" className={styles.socialLink}><img src={xIcon} alt="X" /></a>
              <a href="/" className={styles.socialLink}><img src={discordIcon} alt="Discord" /></a>
              <a href="/" className={styles.socialLink}><img src={gateIcon} alt="Gateway" /></a>
              <a href="/" className={styles.socialLink}><img src={youtubeIcon} alt="YouTube" /></a>
            </div>
          </div>
          <div className={styles.footerLinks}>
            {['FEATURES', 'RESOURCES', 'COMPANY'].map((section, sectionIndex) => (
              <div className={styles.footerColumn} key={sectionIndex}>
                <h3 className={styles.footerColumnTitle}>{section}</h3>
                <ul className={styles.footerColumnList}>
                  {(section === 'FEATURES' ? [
                    "PRIVATE IPFS STORAGE", "IPFS", "END-TO-END ENCRYPTION", "ACCESS CONTROL",
                    "PEER-TO-PEER UPLOADS", "BLOCKCHAIN INTEGRATION", "PERMANENT FILE HOSTING"
                  ] : section === 'RESOURCES' ? [
                    "DOCUMENTATION", "REPORT", "CASE STUDY"
                  ] : [
                    "ABOUT US", "CONTACT", "OUR TEAM"
                  ]).map((item, i) => (
                    <li key={i}><a href="/" className={styles.footerLink}>{item}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>Copyright © 2025 Decentralized Cloud Storage | All rights reserved</p>
          <ul className={styles.footerBottomLinks}>
            {["Privacy policy", "Terms & conditions", "Acceptable use", "DMCA"].map((item, i) => (
              <li key={i}><a href="/" className={styles.footerBottomLink}>{item}</a></li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default DecentralizedCloudStorage;