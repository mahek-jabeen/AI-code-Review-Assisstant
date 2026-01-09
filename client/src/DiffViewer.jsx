import React from "react";
import ReactDiffViewer from "react-diff-viewer";

function DiffViewer({ oldCode, newCode }) {
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div style={{ marginTop: "0" }}>
      <h3
        style={{
          marginBottom: "8px",
          fontSize: "12px",
          fontWeight: "600",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Code Comparison
      </h3>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "0",
          overflow: "hidden",
          maxHeight: "400px",
        }}
      >
        <ReactDiffViewer
          oldValue={oldCode}
          newValue={newCode}
          splitView={true}
          showDiffOnly={false}
          useDarkTheme={isDark}
          leftTitle="Original"
          rightTitle="Improved"
          styles={{
            diffAdded: {
              background: isDark ? "rgba(34, 197, 94, 0.15)" : "rgba(34, 197, 94, 0.1)",
              color: "var(--text-primary)",
            },
            diffRemoved: {
              background: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
              color: "var(--text-primary)",
            },
            line: {
              color: "var(--text-primary)",
            },
            wordDiff: {
              color: "var(--text-primary)",
            },
            codeFoldGutter: {
              background: "var(--card-bg)",
            },
            codeFold: {
              background: "var(--card-bg)",
            },
            gutter: {
              background: "var(--result-bg)",
              color: "var(--text-muted)",
            },
            content: {
              background: "var(--result-bg)",
            },
            titleBlock: {
              background: "var(--editor-bg)",
              color: "var(--text-primary)",
              borderBottom: "1px solid var(--border)",
              padding: "6px 12px",
              fontWeight: "600",
              fontSize: "12px",
            },
          }}
        />
      </div>
    </div>
  );
}

export default DiffViewer;
