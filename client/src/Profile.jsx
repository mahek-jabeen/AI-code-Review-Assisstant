// client/src/Profile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

function Profile({ getAuthConfig, styles, onLogout }) {
  const [profile, setProfile] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/profile",
        getAuthConfig()
      );
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  if (!profile) {
    return (
      <div style={{ padding: "20px", color: "var(--app-text)" }}>
        Loading profile…
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "30px auto",
        padding: "24px",
        borderRadius: "4px",
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
      className="fade-in"
    >
      {/* ===== Header ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#22c55e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            fontWeight: "700",
            color: "#020617",
          }}
        >
          {profile.user.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              color: "var(--text-primary)",
            }}
          >
            {profile.user.name}
          </h2>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            {profile.user.email}
          </p>
        </div>
      </div>

      {/* ===== Stats ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "22px",
        }}
      >
        <StatBox label="Total Reviews" value={profile.totalReviews} />
        <StatBox label="Refactors" value={profile.totalRefactors || 0} />
        <StatBox label="GitHub Reviews" value={profile.githubReviews || 0} />
      </div>

      {/* ===== Account Info ===== */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "14px",
        }}
      >
        <h4
          style={{
            marginBottom: "10px",
            fontSize: "14px",
            color: "var(--text-primary)",
          }}
        >
          Account Information
        </h4>

        <InfoRow label="User ID" value={profile.user._id} />
        <InfoRow label="Plan" value="Free" />
        <InfoRow
          label="Joined"
          value={new Date(profile.user.createdAt).toLocaleDateString()}
        />
      </div>

      {/* ===== Actions ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "20px",
        }}
      >
        <button
          style={{
            background: "var(--danger)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
          }}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

/* ===== Small Components ===== */

function StatBox({ label, value }) {
  return (
    <div
      style={{
        background: "var(--result-bg)",
        border: "1px solid var(--border)",
        borderRadius: "3px",
        padding: "14px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "var(--success)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          marginTop: "4px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        fontSize: "13px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>{value}</span>
    </div>
  );
}

export default Profile;
