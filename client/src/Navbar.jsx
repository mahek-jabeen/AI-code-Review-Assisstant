import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "./ThemeContext";

function Navbar({ styles, onLogout }) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const tabs = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/github-review", label: "GitHub Review" },
    { path: "/history", label: "History" },
    { path: "/profile", label: "Profile" },
  ];

  return (
    <div
      style={{
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "3px",
              background: "var(--nav-active)",
              display: "grid",
              placeItems: "center",
              fontWeight: "700",
              fontSize: "13px",
              color: "#ffffff",
            }}
          >
            AI
          </div>
          <strong
            style={{
              color: "var(--text-primary)",
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            Code Review
          </strong>
        </div>

        <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                style={{
                  padding: "7px 14px",
                  borderRadius: "3px",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 500,
                  textDecoration: "none",
                  background: active ? "var(--nav-active)" : "transparent",
                  color: active
                    ? "var(--nav-active-text)"
                    : "var(--text-secondary)",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.target.style.background = "var(--nav-pill)";
                    e.target.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.target.style.background = "transparent";
                    e.target.style.color = "var(--text-secondary)";
                  }
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            background: "var(--card-bg)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            padding: "5px 10px",
            fontSize: "12px",
            cursor: "pointer",
            outline: "none",
            fontWeight: "500",
          }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>

        <button
          onClick={onLogout}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            padding: "5px 14px",
            borderRadius: "3px",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "var(--danger)";
            e.target.style.color = "#ffffff";
            e.target.style.borderColor = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = "var(--text-secondary)";
            e.target.style.borderColor = "var(--border)";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
