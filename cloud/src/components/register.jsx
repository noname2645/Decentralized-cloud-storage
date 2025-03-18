import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {getAuth, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../config.js';
import "../Stylesheets/register.css";
import Google from "../assets/Images/google.png";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Register = () => {
  const navigate = useNavigate();
  const [text, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Set session persistence inside useEffect
  useEffect(() => {
    setPersistence(auth, browserSessionPersistence)
      .then(() => console.log("Session persistence set"))
      .catch((error) => console.error("Error setting persistence:", error));
  }, []); 

  // Handle Email SignUp
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signed up successfully");

      await sendEmailVerification(userCredential.user);
      console.log("Verification email sent!");

      setIsVerificationSent(true);
      setIsCheckingVerification(true); // Start checking for verification
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Function to check if email is verified
  const checkEmailVerification = async (user) => {
    if (user) {
      await user.reload(); // Reload user to get updated email verification status
      if (user.emailVerified) {
        console.log("User is verified, redirecting...");
        navigate("/home");
      }
    }
  };

  // Check for email verification without requiring reload
  useEffect(() => {
    let interval;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.emailVerified && isCheckingVerification) {
        interval = setInterval(() => checkEmailVerification(user), 3000); // Check every 3 seconds
      } else if (user?.emailVerified) {
        navigate("/home");
      }
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [navigate, isCheckingVerification]);

  // Handle Google SignUp
  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.emailVerified) {
        console.log("Google sign-in successful:", user);
        navigate("/home");
      } else {
        console.log("Google account is not verified.");
        setErrorMessage("Please verify your Google email before proceeding.");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <form className="form" onSubmit={handleEmailSignup}>
      <p className="title">Register</p>

      <label>
        <input
          className="input"
          type="text"
          placeholder="Name"
          required
          value={text}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label>
        <input
          className="input"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label>
        <input
          className="input"
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <button type="submit" className="submit">Register</button>

      {isVerificationSent && (
        <div className="verification-message">
          <p>Please check your email to verify your account.</p>
        </div>
      )}

      {errorMessage && <p className="error">{errorMessage}</p>}

      <p id="OR">OR USE THIS METHOD</p>

      <button
        type="button"
        onClick={handleGoogleSignup}
        className="google-signup-btn">
        <img className="gimg" src={Google} alt="Google icon" />
        <p id="gtext">Sign Up with Google</p>
      </button>

      <p className="signin">Already have an account? <a href="/login">Sign in</a></p>
    </form>
  );
};

export default Register;