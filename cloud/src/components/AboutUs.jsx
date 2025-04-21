import React from "react";
import { useState, useEffect } from "react";
import "../stylesheets/AboutUs.css";

export default function Team() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in effect on load
    setIsVisible(true);
  }, []);

  // Team member data
  const teamMembers = [
    {
      name: "Rohit Karmokar",
      role: "Lead Blockchain Developer",
      description: "Blockchain specialist in distributed systems and decentralized applications. Expert in IPFS implementation and smart contract development.",
      avatar: "https://cdn-icons-png.flaticon.com/512/6878/6878865.png" // Replace with your actual image path
    },
    {
      name: "Jayanth Kuna",
      role: "UI UX Designer and Developer",
      description: "UI/UX Developer specializing in intuitive interface design. Crafts visually engaging, user-centered experiences that enhance usability.",
      avatar: "https://cdn-icons-png.flaticon.com/512/6878/6878865.png" // Replace with your actual image path
    },
    {
      name: "Om Mahindroo",
      role: "Backend Developer",
      description: "Designs intuitive user experiences that make decentralized technology accessible to everyone. Bridges the gap between complex technology and everyday users.",
      avatar: "https://cdn-icons-png.flaticon.com/512/6878/6878865.png" // Replace with your actual image path
    }
  ];

  return (
    <div className="team-container">
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
      <div className={`team-content-wrapper ${isVisible ? 'visible' : 'hidden'}`}>
        <h1 className="team-main-title">
          Meet Our Team
        </h1>
        
        <p className="team-intro">
          Our team of experts is passionate about decentralized technologies and 
          committed to building a more secure, private, and resilient internet.
        </p>

        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} delay={index * 0.2} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamMemberCard({ member, delay }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`team-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="card-inner">
        <div className="card-front">
          <div className="avatar-container">
            <img className="avatar" src={member.avatar} alt={member.name} />
            <div className="avatar-ring"></div>
          </div>
          <h2 className="member-name">{member.name}</h2>
          <p className="member-role">{member.role}</p>
        </div>
        <div className="card-back">
          <h2 className="member-name">{member.name}</h2>
          <p className="member-role">{member.role}</p>
          <p className="member-description">{member.description}</p>
          <div className="social-links">
            <a href="#" className="social-link">GH</a>
            <a href="#" className="social-link">LI</a>
          </div>
        </div>
      </div>
    </div>
  );
}
