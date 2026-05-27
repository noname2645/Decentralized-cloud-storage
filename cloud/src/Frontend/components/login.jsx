import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  setPersistence, 
  browserSessionPersistence 
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './config.js';
import Google from '../assets/Images/google.png';
import "../stylesheets/login.css";
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle Email Sign In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear any previous error
    setLoading(true);
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
          setErrorMessage("Login failed. Check details or connection.");
      }
    } finally {
      setLoading(false);
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
      console.error("Google sign-in error:", error);
      setErrorMessage(error.message || "Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="login-page-root">
      {/* Dynamic Background Glow circles */}
      <div className="bg-glow-orb bg-glow-orb-1"></div>
      <div className="bg-glow-orb bg-glow-orb-2"></div>

      <div className="form-container">
        <form className="register-form" onSubmit={handleEmailSignIn}>
          <div className="form-header">
            <h2 className="register-title">Sign In</h2>
            <p className="form-subtitle">Access your secure decentralized drive</p>
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
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          <div className="forgot-password-link-wrapper">
            <Link to="/forgotpass" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? "Authenticating..." : (
              <>
                <span>Login</span>
                <LogIn size={16} />
              </>
            )}
          </button>

          {errorMessage && <div className="register-error">{errorMessage}</div>}

          <div className="divider-or">
            <span className="divider-line"></span>
            <span className="divider-text">OR USE METHOD</span>
            <span className="divider-line"></span>
          </div>

          <button type="button" onClick={handleGoogleSignIn} className="register-google-btn">
            <img className="register-gimg" src={Google} alt="Google icon" />
            <span className="register-gtext">Sign In with Google</span>
          </button>

          <p className="register-signin">
            Don't have an account? <Link to="/register">Register <ArrowRight size={14} style={{ display: 'inline', marginLeft: '2px', verticalAlign: 'middle' }} /></Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;