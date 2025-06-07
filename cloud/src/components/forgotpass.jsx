// 🔐 forgotPassword.js
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("📧 Reset email sent! Check your inbox (or spam folder)");
    } catch (error) {
      setMessage("❌ Failed to send reset email: " + error.message);
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Forgot Password 🔑</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: "0.5rem", borderRadius: "5px", width: "300px", marginBottom: "1rem" }}
      />
      <br />
      <button
        onClick={handleReset}
        style={{
          background: "#ffa500",
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Send Reset Link
      </button>
      <p style={{ marginTop: "1rem", color: "#00adb5" }}>{message}</p>
    </div>
  );
};

export default ForgotPassword;
