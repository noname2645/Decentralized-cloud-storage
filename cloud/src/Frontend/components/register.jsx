import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../components/config.js';
import Google from '../assets/Images/google.png';
import "../stylesheets/register.css";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Register = () => {
  const navigate = useNavigate();
  const [text, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // 🔁 Setup session persistence
  useEffect(() => {
    setPersistence(auth, browserSessionPersistence).catch((error) =>
      console.error('Error setting persistence:', error)
    );
  }, []);

  // ✅ Email Signup
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setIsVerificationSent(true);
      setIsCheckingVerification(true);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const checkEmailVerification = async (user) => {
    if (user) {
      await user.reload();
      if (user.emailVerified) navigate('/home');
    }
  };

  // 🔄 Check verification state
  useEffect(() => {
    let interval;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.emailVerified && isCheckingVerification) {
        interval = setInterval(() => checkEmailVerification(user), 3000);
      } else if (user?.emailVerified) {
        navigate('/home');
      }
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [navigate, isCheckingVerification]);

  // 🟢 Google Sign-In
  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user.emailVerified) navigate('/home');
      else setErrorMessage('Please verify your Google email before proceeding.');
    } catch (error) {
      setErrorMessage(error.message);
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
        <form className="register-form" onSubmit={handleEmailSignup}>
          <p className="register-title">Register</p>

          <label>
            <input
              className="register-input"
              type="text"
              placeholder="Name"
              required
              value={text}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

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

          <button type="submit" className="register-submit">Register</button>

          {isVerificationSent && (
            <div className="verification-message">
              <p>Please check your email to verify your account.</p>
            </div>
          )}

          {errorMessage && <p className="register-error">{errorMessage}</p>}

          <p className="register-or">OR USE THIS METHOD</p>

          <button type="button" onClick={handleGoogleSignup} className="register-google-btn">
            <img className="register-gimg" src={Google} alt="Google icon" />
            <p className="register-gtext">Sign Up with Google</p>
          </button>

          <p className="register-signin">Already have an account? <a href="/login">Sign in</a></p>
        </form>
      </div>
    </>
  );
};

export default Register;
