import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Mail, Lock, User, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  // 🔁 Setup session persistence
  useEffect(() => {
    setPersistence(auth, browserSessionPersistence).catch((error) =>
      console.error('Error setting persistence:', error)
    );
  }, []);

  // ✅ Email Signup
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setIsVerificationSent(true);
      setIsCheckingVerification(true);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage("Email is already registered. Please login.");
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage("Password is too weak. Make it at least 6 characters.");
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setLoading(false);
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
    <div className="login-page-root">
      {/* Dynamic Background Glow circles */}
      <div className="bg-glow-orb bg-glow-orb-1"></div>
      <div className="bg-glow-orb bg-glow-orb-2"></div>

      <div className="form-container">
        <form className="register-form" onSubmit={handleEmailSignup}>
          <div className="form-header">
            <h2 className="register-title">Register</h2>
            <p className="form-subtitle">Create your secure decentralized cloud account</p>
          </div>

          <div className="input-group">
            <label className="input-label-wrapper">
              <User className="input-icon-svg" size={18} />
              <input
                className="register-input"
                type="text"
                placeholder="Full Name"
                required
                value={text}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label-wrapper">
              <Mail className="input-icon-svg" size={18} />
              <input
                className="register-input"
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label-wrapper">
              <Lock className="input-icon-svg" size={18} />
              <input
                className="register-input"
                type="password"
                placeholder="Secure Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? "Registering..." : (
              <>
                <span>Register</span>
                <UserPlus size={16} />
              </>
            )}
          </button>

          {isVerificationSent && (
            <div className="verification-message-box">
              <CheckCircle size={16} />
              <p>Verification link sent! Check your inbox to complete registration.</p>
            </div>
          )}

          {errorMessage && <div className="register-error">{errorMessage}</div>}

          <div className="divider-or">
            <span className="divider-line"></span>
            <span className="divider-text">OR USE METHOD</span>
            <span className="divider-line"></span>
          </div>

          <button type="button" onClick={handleGoogleSignup} className="register-google-btn">
            <img className="register-gimg" src={Google} alt="Google icon" />
            <span className="register-gtext">Sign Up with Google</span>
          </button>

          <p className="register-signin">
            Already have an account? <Link to="/login"><ArrowLeft size={14} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} /> Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
