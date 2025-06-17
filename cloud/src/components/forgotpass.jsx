// 🔐 forgotPassword.js
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import "../stylesheets/forgotpass.css";
import * as THREE from 'three';


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(""); // 'success' or 'error'


  const handleReset = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Reset email sent! Check your inbox (or spam folder)");
      setStatus("success");
    } catch (error) {
      setMessage("Failed to send reset email: " + error.message);
      setStatus("error");
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
      const particleCount = 2000;
      const posArray = new Float32Array(particleCount * 3);
      const colorArray = new Float32Array(particleCount * 3);
  
      for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
        colorArray[i] = i % 3 === 0 ? Math.random() * 0.2 + 0.8 : i % 3 === 1 ? Math.random() * 0.5 : Math.random() * 0.8 + 0.2;
      }
  
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.2,
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
        opacity: 0.3,
      });
  
      const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(linesMesh);
  
      function animate() {
        requestAnimationFrame(animate);
        particlesMesh.rotation.x += 0.0005;
        particlesMesh.rotation.y += 0.001;
        linesMesh.material.opacity = 0.2 + Math.sin(Date.now() * 0.001) * 0.1;
        renderer.render(scene, camera);
      }
  
      animate();
  
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
  
      return () => {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      };
    }, []);


  return (
    <>
      <div
        id="canvas-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        }}
      ></div>

      <div className="form-container">
        <form className="register-form">
          <p className="register-title">Reset Password</p>
          <label>
            <input
              className="register-input"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button type="button" onClick={handleReset} className="register-submit">Send Link</button>
        </form>
        {message && (
          <div
            className={`notification ${status}`}
            style={{
              position: "fixed",
              top: "20px",
              left: "32.5%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              padding: "1rem 2rem",
              borderRadius: "10px",
              color: "#fff",
              backgroundColor: status === "success" ? "#00b894" : "#d63031",
              boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
              animation: "fadeInOut 4s ease",
              fontWeight: "bold",
              textAlign: "center",

            }}
          >
            {message}
          </div>
        )}
      </div>
    </>
  );
};

export default ForgotPassword;