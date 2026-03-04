// client/src/Auth.jsx
import React, { useState } from "react";
import axios from "axios";
import "./animations.css"; // for fade-in if you want

function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async () => {
    try {
      setError("");
      setLoading(true);

      const url = isLogin
        ? "https://ai-code-review-assisstant.onrender.com/api/auth/login"
        : "https://ai-code-review-assisstant.onrender.com/api/auth/signup";

      const payload = isLogin
        ? {
            email: form.email,
            password: form.password,
          }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
          };

      const res = await axios.post(url, payload);

      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
    } catch (err) {
      console.error("❌ Auth Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "radial-gradient(circle at top, #1d4ed8 0, #020617 40%, #000 100%)",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
      color: "#e5e7eb",
      padding: "16px",
    },
    container: {
      display: "flex",
      width: "100%",
      maxWidth: "900px",
      borderRadius: "18px",
      overflow: "hidden",
      border: "1px solid rgba(148,163,184,0.3)",
      boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
      backdropFilter: "blur(10px)",
      background:
        "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.85))",
    },
    left: {
      flex: 1,
      padding: "28px 26px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    right: {
      flex: 1,
      padding: "28px 26px",
      borderLeft: "1px solid rgba(55,65,81,0.7)",
      background:
        "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 60%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    logo: {
      fontSize: "20px",
      fontWeight: 700,
      marginBottom: "8px",
    },
    badge: {
      display: "inline-block",
      fontSize: "11px",
      background: "rgba(34,197,94,0.1)",
      color: "#4ade80",
      borderRadius: "999px",
      padding: "3px 9px",
      marginBottom: "10px",
    },
    tabs: {
      display: "flex",
      marginTop: "16px",
      borderBottom: "1px solid rgba(51,65,85,0.9)",
    },
    tab: (active) => ({
      flex: 1,
      textAlign: "center",
      padding: "8px 0",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: active ? 600 : 500,
      borderBottom: active ? "2px solid #22c55e" : "2px solid transparent",
      color: active ? "#e5e7eb" : "#9ca3af",
      transition: "all 0.2s ease",
    }),
    label: {
      fontSize: "12px",
      marginBottom: "4px",
      color: "#9ca3af",
    },
    input: {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  outline: "none",
  fontSize: "13px",
  marginBottom: "10px",
  boxSizing: "border-box",   // ✅ important
},

    buttonPrimary: {
      width: "100%",
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      border: "none",
      color: "#020617",
      fontWeight: 600,
      borderRadius: "999px",
      padding: "8px 0",
      cursor: "pointer",
      marginTop: "4px",
      fontSize: "14px",
    },
    toggleText: {
      marginTop: "10px",
      fontSize: "12px",
      color: "#9ca3af",
      textAlign: "center",
    },
    toggleLink: {
      color: "#38bdf8",
      cursor: "pointer",
      marginLeft: "4px",
    },
    error: {
      marginTop: "6px",
      fontSize: "12px",
      color: "#f97373",
      textAlign: "center",
    },
    sideTitle: {
      fontSize: "18px",
      fontWeight: 600,
      marginBottom: "6px",
    },
    bullet: {
      fontSize: "12px",
      color: "#9ca3af",
      marginBottom: "4px",
    },
    statBox: {
      marginTop: "14px",
      padding: "10px",
      borderRadius: "10px",
      background: "rgba(15,23,42,0.9)",
      border: "1px solid rgba(75,85,99,0.8)",
    },
    statLabel: {
      fontSize: "11px",
      color: "#9ca3af",
    },
    statValue: {
      fontSize: "16px",
      fontWeight: 600,
    },
    footer: {
      marginTop: "16px",
      fontSize: "11px",
      color: "#6b7280",
    },
  };

  return (
    <div style={styles.page}>
      <div className="fade-in" style={styles.container}>
        {/* LEFT: Auth form */}
        <div style={styles.left}>
          <div>
            <div style={styles.logo}>⚙️ AI Code Review Assistant</div>
            <span style={styles.badge}>Developer Productivity Suite</span>

            <div style={styles.tabs}>
              <div
                style={styles.tab(isLogin)}
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
              >
                Login
              </div>
              <div
                style={styles.tab(!isLogin)}
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
              >
                Create Account
              </div>
            </div>

            <div style={{ marginTop: "14px" }}>
              {!isLogin && (
                <>
                  <label style={styles.label}>Full Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </>
              )}

              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <label style={styles.label}>Password</label>

<div style={{ position: "relative" }}>
  <input
    style={{
      ...styles.input,
      paddingRight: "60px",
    }}
    type={showPassword ? "text" : "password"}
    placeholder="••••••••"
    value={form.password}
    onChange={(e) =>
      setForm({ ...form, password: e.target.value })
    }
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      fontSize: "12px",
      color: "#38bdf8",
      fontWeight: "600",
      userSelect: "none",
    }}
  >
    {showPassword ? "Hide" : "Show"}
  </span>
</div>


              <button
                style={styles.buttonPrimary}
                className="btn-glow"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? isLogin
                    ? "Logging in..."
                    : "Creating account..."
                  : isLogin
                  ? "Login"
                  : "Sign Up"}
              </button>

              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.toggleText}>
                {isLogin ? "Don't have an account?" : "Already registered?"}
                <span
                  style={styles.toggleLink}
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                >
                  {isLogin ? "Create one" : "Login here"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "14px" }}>
            By continuing, you agree to our terms of use and data policy.
          </div>
        </div>

        {/* RIGHT: Marketing / Info side */}
        <div style={styles.right}>
          <div>
            <div style={styles.sideTitle}>Ship better code, faster. 🚀</div>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>
              Your personal AI code reviewer that:
            </p>
            <ul style={{ paddingLeft: "16px", margin: 0 }}>
              <li style={styles.bullet}>Finds bugs and security issues</li>
              <li style={styles.bullet}>Suggests refactors & best practices</li>
              <li style={styles.bullet}>Reviews full GitHub repositories</li>
              <li style={styles.bullet}>Keeps a history of all your reviews</li>
            </ul>

            <div style={styles.statBox}>
              <div style={styles.statLabel}>Why developers use this:</div>
              <div style={styles.statValue}>⚡ Faster reviews, cleaner code</div>
              <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                Integrate AI into your daily workflow and get instant feedback on
                every snippet, function, or repository.
              </p>
            </div>
          </div>

          <div style={styles.footer}>
            Tip: Use a test account like <strong>test@gmail.com</strong> to
            quickly try the app during demos.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
