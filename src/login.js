import React, { useState } from "react";

const BACKEND_URL = "https://construction-assembly-backend.onrender.com";

function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
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
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#ffffff",
    }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ marginBottom: "24px", color: "#333" }}>Construction Assembly Logger</h2>
        <form onSubmit={handleSubmit} style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "12px 16px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              width: "260px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 16px",
              fontSize: "16px",
              backgroundColor: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              width: "260px",
              boxSizing: "border-box",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Checking..." : "Enter"}
          </button>
          {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;