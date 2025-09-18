import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence, } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './config.js';
import Google from '../assets/Images/google.png';
import "../stylesheets/login.css";

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