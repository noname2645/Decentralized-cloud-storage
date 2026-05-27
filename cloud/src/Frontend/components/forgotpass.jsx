import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../stylesheets/forgotpass.css";
import * as THREE from 'three';
import { Mail, Key, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // 'success' or 'error'
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Reset email sent! Check your inbox.");
      setStatus("success");
    } catch (error) {
      setMessage("Failed to send link: " + error.message);
      setStatus("error");
    } finally {
      setLoading(false);
    }

    // Optional: Auto-hide after 4s
    setTimeout(() => {
      setMessage("");
      setStatus("");
    }, 4000);
  };

  // Three.js background effect
  React.useEffect(() => {
    const container = document.getElementById('canvas-container');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1200; // slightly optimized
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
      colorArray[i] = i % 3 === 0 ? Math.random() * 0.2 + 0.8 : i % 3 === 1 ? Math.random() * 0.5 : Math.random() * 0.8 + 0.2;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const lineGeometry = new THREE.BufferGeometry();
    const linePosArray = new Float32Array(particleCount * 3 * 2);

    for (let i = 0; i < particleCount * 3; i += 3) {
      if (Math.random() > 0.95) {
        const j = Math.floor(Math.random() * particleCount) * 3;
        linePosArray[i * 2] = posArray[i];
        linePosArray[i * 2 + 1] = posArray[i + 1];
        linePosArray[i * 2 + 2] = posArray[i + 2];
        linePosArray[i * 2 + 3] = posArray[j];
        linePosArray[i * 2 + 4] = posArray[j + 1];
        linePosArray[i * 2 + 5] = posArray[j + 2];
      }
    }

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePosArray, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    let animationFrameId;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      particlesMesh.rotation.x += 0.0003;
      particlesMesh.rotation.y += 0.0006;
      linesMesh.material.opacity = 0.15 + Math.sin(Date.now() * 0.001) * 0.05;
      renderer.render(scene, camera);
    }

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="login-page-root">
      <div id="canvas-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}></div>

      <div className="form-container">
        <form className="register-form" onSubmit={handleReset}>
          <div className="form-header">
            <h2 className="register-title">Reset Password</h2>
            <p className="form-subtitle">We will send a secure link to your email</p>
          </div>

          <div className="input-group">
            <label className="input-label-wrapper">
              <Mail className="input-icon-svg" size={18} />
              <input
                className="register-input"
                type="email"
                placeholder="Registered Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? "Sending..." : (
              <>
                <span>Send Reset Link</span>
                <Send size={16} />
              </>
            )}
          </button>

          <p className="register-signin">
            <Link to="/login">
              <ArrowLeft size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> 
              Back to Login
            </Link>
          </p>
        </form>

        {message && (
          <div className={`notification-toast ${status}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;