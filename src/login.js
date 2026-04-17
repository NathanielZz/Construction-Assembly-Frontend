import React, { useState } from "react";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function Login({ onLogin, onBack }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Incorrect password. Please try again.");
        setPassword("");
      } else {
        sessionStorage.setItem("token", data.token);
        onLogin();
      }
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f2f2f2"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        padding: "40px 32px 32px 32px",
        minWidth: 340,
        maxWidth: 360,
        width: "100%",
        textAlign: "center",
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}>
        <h2 style={{ marginBottom: 24, color: "#2596be", fontWeight: 700, fontSize: 26, letterSpacing: 0.5 }}>Construction Assembly Logger</h2>
        <button
          type="button"
          onClick={onBack}
          style={{
            marginBottom: 22,
            padding: "8px 18px",
            fontSize: 15,
            background: "#e6f4fa",
            color: "#2596be",
            border: "1px solid #38caef",
            borderRadius: 6,
            cursor: "pointer",
            transition: "background 0.2s, color 0.2s, border 0.2s"
          }}
        >
          ← Back
        </button>
        <form onSubmit={handleSubmit} style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0
        }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "12px 16px",
              fontSize: 16,
              border: "1px solid #ccc",
              borderRadius: 6,
              width: 260,
              marginBottom: 14,
              boxSizing: "border-box",
              outline: "none"
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 16px",
              fontSize: 16,
              backgroundColor: loading ? "#b3b3b3" : "#2596be",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              width: 260,
              boxSizing: "border-box",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              marginBottom: 0
            }}
          >
            {loading ? "Checking..." : "Enter"}
          </button>
          {error && <p style={{ color: "#d32f2f", marginTop: 14, fontWeight: 500 }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;