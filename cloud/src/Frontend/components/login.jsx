import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence, } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import * as THREE from 'three';
import { firebaseConfig } from './config';
import Google from '../assets/Images/google.png';
import "../Stylesheets/login.css";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Handle Email Sign In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear any previous error
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        navigate("/home");
      }
    } catch (error) {
      // Handle specific Firebase Auth error codes
      switch (error.code) {
        case "auth/user-not-found":
          setErrorMessage("User not registered. Please sign up first.");
          break;
        case "auth/wrong-password":
          setErrorMessage("Incorrect password. Please try again.");
          break;
        case "auth/invalid-email":
          setErrorMessage("Invalid email format.");
          break;
        default:
          setErrorMessage("Login failed. " + error.message);
      }
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setErrorMessage(""); // Clear any previous error
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        navigate("/home");
      }
    } catch (error) {
      // Optional: add specific error handling for Google Sign-In
      setErrorMessage("Google sign-in failed. " + error.message);
    }
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
        <form className="register-form" onSubmit={handleEmailSignIn}>
          <p className="register-title">Login</p>

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

          <label>
            <input
              className="register-input"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <p>
            <Link to="/forgotpass" style={{ color: "#00adb5" }}>
              Forgot Password?
            </Link>
          </p>


          <button type="submit" className="register-submit">Login</button>

          {errorMessage && <p className="register-error">{errorMessage}</p>}

          <p className="register-or">OR USE THIS METHOD</p>

          <button type="button" onClick={handleGoogleSignIn} className="register-google-btn">
            <img className="register-gimg" src={Google} alt="Google icon" />
            <p className="register-gtext">Sign In with Google</p>
          </button>

          <p className="register-signin">Don't have an account? <Link to="/register">Register</Link></p>
        </form>
      </div>
    </>
  );
};

export default Login;