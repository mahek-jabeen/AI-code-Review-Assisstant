// client/src/App.js
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./Auth";
import Navbar from "./Navbar";
import Profile from "./Profile";
import "./animations.css";
import DiffViewer from "./DiffViewer";
import jsPDF from "jspdf";
import "./theme.css";
import { ThemeProvider } from "./ThemeContext";

const LANGUAGE_OPTIONS = [
  { label: "JavaScript", value: "javascript" },
  { label: "Java", value: "java" },
  { label: "Python", value: "python" },
  { label: "C++", value: "cpp" },
  { label: "C", value: "c" },
];

function Dashboard({ getAuthConfig, styles }) {
  const [diffHeight, setDiffHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [refactorResult, setRefactorResult] = useState(null);
  const [refactorLoading, setRefactorLoading] = useState(false);
  const [language, setLanguage] = useState("javascript");
  
  // Resizable panes state
  const [editorWidth, setEditorWidth] = useState(60); // percentage
  const [refactorHeight, setRefactorHeight] = useState(250); // pixels - increased for split view
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [bottomPanelSplit, setBottomPanelSplit] = useState(40); // percentage for summary vs code

  // Handle vertical splitter (Editor <-> AI Review)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingVertical) {
        const container = document.querySelector('.dashboard-main');
        if (container) {
          const containerWidth = container.offsetWidth;
          const newWidth = (e.clientX / containerWidth) * 100;
          // Constrain between 30% and 70%
          setEditorWidth(Math.min(Math.max(newWidth, 30), 70));
        }
      }
      
      if (isResizingHorizontal) {
        const container = document.querySelector('.dashboard-container');
        if (container) {
          const containerHeight = container.offsetHeight;
          const newHeight = containerHeight - e.clientY;
          // Constrain between 150px and 500px for split view
          setRefactorHeight(Math.min(Math.max(newHeight, 150), 500));
        }
      }
      
      if (isDragging) {
        setDiffHeight((prev) => Math.max(150, prev - e.movementY));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingVertical(false);
      setIsResizingHorizontal(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingVertical || isResizingHorizontal || isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizingVertical, isResizingHorizontal]);

  const [code, setCode] = useState("// Write your code here");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [issues, setIssues] = useState([]);
  const [improvedCode, setImprovedCode] = useState("");

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const applyMarkers = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const markers = issues.map((issue) => ({
      startLineNumber: issue.line,
      startColumn: 1,
      endLineNumber: issue.line,
      endColumn: 100,
      message: issue.message,
      severity:
        issue.type === "bug"
          ? monacoRef.current.MarkerSeverity.Error
          : issue.type === "warning"
          ? monacoRef.current.MarkerSeverity.Warning
          : monacoRef.current.MarkerSeverity.Info,
    }));

    monacoRef.current.editor.setModelMarkers(
      editorRef.current.getModel(),
      "ai-review",
      markers
    );
  }, [issues]);

  useEffect(() => {
    if (issues.length > 0) {
      applyMarkers();
    }
  }, [issues, applyMarkers]);

  const handleReview = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:4000/api/review",
        { code, language },
        getAuthConfig()
      );

      setResponse(res.data.result.summary);
      setIssues(res.data.result.issues || []);
      setImprovedCode(res.data.result.improvedCode || "");
    } catch (err) {
      console.error(err);
      setResponse("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRefactor = async (options = {}) => {
    try {
      setRefactorLoading(true);

      const body = {
        code,
        language,
        goals: options.goals || [],
      };

      const res = await axios.post(
        "http://localhost:4000/api/refactor",
        body,
        getAuthConfig()
      );

      setRefactorResult(res.data.result);
    } catch (err) {
      console.error("Refactor failed", err);
      setRefactorResult({
        explanation:
          "Refactor failed: " + (err.response?.data?.error || err.message),
      });
    } finally {
      setRefactorLoading(false);
    }
  };





  return (
    <div 
      className="dashboard-container"
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "calc(100vh - 65px)",
        overflow: "hidden",
        background: "var(--bg)",
        position: "relative"
      }}
    >
      {/* Main Content Area: Resizable Split */}
      <div 
        className="dashboard-main fade-in"
        style={{ 
          display: "flex",
          gap: 0,
          flex: refactorResult ? `1 1 calc(100% - ${refactorHeight}px)` : 1,
          minHeight: 0,
          padding: 0,
          width: "100%",
          margin: 0,
          position: "relative"
        }}
      >
        {/* LEFT PANEL: Code Editor (Resizable) */}
        <div
          className="editor-section"
          style={{
            flex: `0 0 ${editorWidth}%`,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            background: "var(--editor-bg)",
            padding: "12px 16px",
            overflow: "hidden",
          }}
        >
          {/* Editor Header - Minimal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Editor
            </h3>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: "var(--card-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "3px",
                padding: "4px 8px",
                fontSize: "12px",
                cursor: "pointer",
                outline: "none",
                fontWeight: "500",
              }}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Monaco Editor */}
          <div
            style={{
              flex: 1,
              borderRadius: "0",
              overflow: "hidden",
              border: "1px solid var(--border)",
              minHeight: 0,
            }}
          >
            <Editor
              height="100%"
              language={language}
              value={code}
              theme={
                document.documentElement.classList.contains("dark")
                  ? "vs-dark"
                  : "light"
              }
              onChange={(value) => setCode(value || "")}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Action Buttons - Compact */}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button style={styles.buttonPrimary} onClick={handleReview}>
              {loading ? "Analyzing..." : "Review Code"}
            </button>

            <button style={styles.buttonSecondary} onClick={() => handleRefactor({ goals: ["reduce complexity", "improve speed"] })}>
              {refactorLoading ? "Refactoring..." : "Refactor"}
            </button>

            <button
              style={styles.buttonSecondary}
              onClick={() =>
                handleRefactor({
                  goals: [
                    "improve readability",
                    "reduce cognitive complexity",
                    "extract reusable methods",
                    "upgrade to modern ES6+ syntax",
                    "eliminate redundant code",
                    "enhance maintainability",
                  ],
                  smart: true,
                })
              }
            >
              Smart Refactor
            </button>
          </div>
        </div>

        {/* VERTICAL SPLITTER */}
        <div
          style={{
            width: "5px",
            background: "transparent",
            cursor: "col-resize",
            position: "relative",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingVertical(true);
            document.body.style.cursor = 'col-resize';
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--nav-active)";
          }}
          onMouseLeave={(e) => {
            if (!isResizingVertical) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <div
            style={{
              width: "1px",
              height: "100%",
              background: "var(--border)",
            }}
          />
        </div>

        {/* RIGHT PANEL: AI Review / Diff (Resizable) */}
        <div
          className="review-section"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            background: "var(--result-bg)",
            padding: "12px 16px",
            overflow: "hidden",
          }}
        >
          {/* Review Header - Minimal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              AI Review
            </h3>
            {response && (
              <span
                style={{
                  fontSize: "11px",
                  background: "var(--success)",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  color: "#ffffff",
                  fontWeight: "600",
                }}
              >
                ✓ Complete
              </span>
            )}
          </div>

          {/* Review Content - Scrollable */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              background: "var(--card-bg)",
              borderRadius: "0",
              padding: "12px",
              border: "1px solid var(--border)",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <div className="spinner"></div>
              </div>
            ) : response ? (
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  color: "var(--text-primary)",
                }}
              >
                {response}
              </pre>
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", margin: "20px 0", fontSize: "13px" }}>
                Click "Review Code" to analyze your code with AI
              </p>
            )}
          </div>

          {/* Diff Viewer (if improved code exists) */}
          {improvedCode && (
            <>
              <div
                style={{
                  height: "4px",
                  background: "var(--border)",
                  cursor: "row-resize",
                  margin: "10px 0",
                  borderRadius: "0",
                  transition: "background 0.2s ease",
                }}
                onMouseDown={() => setIsDragging(true)}
                onMouseEnter={(e) => {
                  e.target.style.background = "var(--nav-active)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "var(--border)";
                }}
              />

              <div
                style={{
                  height: diffHeight,
                  maxHeight: "40vh",
                  minHeight: "150px",
                  overflowY: "auto",
                  borderRadius: "0",
                  border: "1px solid var(--border)",
                }}
              >
                <DiffViewer oldCode={code} newCode={improvedCode} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* HORIZONTAL SPLITTER (only visible when refactor panel is shown) */}
      {refactorResult && (
        <div
          style={{
            height: "5px",
            background: "transparent",
            cursor: "row-resize",
            position: "relative",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingHorizontal(true);
            document.body.style.cursor = 'row-resize';
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--nav-active)";
          }}
          onMouseLeave={(e) => {
            if (!isResizingHorizontal) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "var(--border)",
            }}
          />
        </div>
      )}

      {/* BOTTOM PANEL: Refactor Summary & Code - Split View */}
      {refactorResult && (
        <div
          className="refactor-summary-panel"
          style={{
            height: `${refactorHeight}px`,
            minHeight: `${refactorHeight}px`,
            maxHeight: `${refactorHeight}px`,
            background: "var(--editor-bg)",
            display: "flex",
            gap: 0,
            flexShrink: 0,
            width: "100%",
            overflow: "hidden"
          }}
        >
          {/* LEFT: Refactor Summary Panel */}
          <div style={{ 
            flex: `0 0 ${bottomPanelSplit}%`,
            display: "flex",
            flexDirection: "column",
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            margin: "12px 0 12px 12px",
            overflow: "hidden"
          }}>
            {/* Summary Header */}
            <div style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              background: "var(--editor-bg)"
            }}>
              <h4 style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}>
                Refactor Summary
              </h4>
            </div>

            {/* Summary Content */}
            <div style={{
              flex: 1,
              padding: "12px 14px",
              overflowY: "auto",
              fontSize: "13px",
              lineHeight: "1.6",
              color: "var(--text-primary)"
            }}>
              {/* Explanation */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6" }}>
                  {refactorResult.explanation || "Refactoring completed successfully"}
                </p>
              </div>

              {/* Complexity Metrics */}
              {refactorResult.complexity && (
                <div style={{ 
                  marginBottom: "16px",
                  padding: "10px",
                  background: "var(--result-bg)",
                  borderRadius: "4px",
                  border: "1px solid var(--border)"
                }}>
                  <h5 style={{
                    margin: "0 0 8px 0",
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Complexity
                  </h5>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>Before</span>
                      <div style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "14px" }}>
                        {refactorResult.complexity.before?.time || "N/A"}
                      </div>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>→</div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block" }}>After</span>
                      <div style={{ color: "var(--success)", fontWeight: "700", fontSize: "14px" }}>
                        {refactorResult.complexity.after?.time || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Gain */}
              {refactorResult.complexity?.estimatedSpeedup && (
                <div style={{ 
                  marginBottom: "16px",
                  padding: "10px",
                  background: "var(--result-bg)",
                  borderRadius: "4px",
                  border: "1px solid var(--border)"
                }}>
                  <h5 style={{
                    margin: "0 0 8px 0",
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Performance Gain
                  </h5>
                  <div style={{ fontSize: "20px", color: "var(--success)", fontWeight: "700" }}>
                    {refactorResult.complexity.estimatedSpeedup}
                  </div>
                </div>
              )}

              {/* Key Improvements */}
              {refactorResult.methodSuggestions && refactorResult.methodSuggestions.length > 0 && (
                <div style={{ 
                  marginBottom: "16px",
                  padding: "10px",
                  background: "var(--result-bg)",
                  borderRadius: "4px",
                  border: "1px solid var(--border)"
                }}>
                  <h5 style={{
                    margin: "0 0 8px 0",
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Key Improvements
                  </h5>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: "1.5" }}>
                    {refactorResult.methodSuggestions.map((m, i) => (
                      <div key={i} style={{ marginBottom: "4px" }}>
                        • {m.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              {refactorResult.improvedCode && (
                <button
                  style={{
                    background: "var(--nav-active)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    padding: "10px 16px",
                    fontWeight: "600",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    width: "100%"
                  }}
                  onClick={() => {
                    setCode(refactorResult.improvedCode);
                    setRefactorResult(null);
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = "1";
                  }}
                >
                  Apply Refactored Code
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Refactored Code Panel */}
          {refactorResult.improvedCode && (
            <div style={{ 
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              margin: "12px 12px 12px 12px",
              overflow: "hidden"
            }}>
              {/* Code Header */}
              <div style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                background: "var(--editor-bg)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}>
                  Refactored Code
                </h4>
                <span style={{
                  fontSize: "11px",
                  background: "var(--success)",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  color: "#ffffff",
                  fontWeight: "600",
                }}>
                  ✓ Ready
                </span>
              </div>

              {/* Code Content */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                background: "var(--code-bg)",
                padding: "12px 14px"
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {refactorResult.improvedCode}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GithubReview({ getAuthConfig, styles }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoReview, setRepoReview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGithubReview = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:4000/api/github-review",
        { repoUrl },
        getAuthConfig()
      );

      setRepoReview(res.data.summary);
    } catch (err) {
      console.error(err);
      setRepoReview("GitHub review failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer} className="fade-in">
      <div style={styles.card}>
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--text-primary)",
          }}
        >
          GitHub Repository Review
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            marginBottom: "20px",
          }}
        >
          Enter a GitHub repository URL to analyze the codebase
        </p>

        <input
          type="text"
          placeholder="https://github.com/username/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            marginBottom: "12px",
            background: "var(--card-bg)",
            color: "var(--text-primary)",
            width: "100%",
            fontSize: "14px",
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--nav-active)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border)";
          }}
        />

        <button style={styles.buttonPrimary} onClick={handleGithubReview}>
          {loading ? "Analyzing..." : "Analyze Repository"}
        </button>

        {repoReview && (
          <div
            style={{
              marginTop: "20px",
              background: "var(--result-bg)",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "var(--text-primary)",
              }}
            >
              Analysis Result
            </h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                margin: 0,
                fontSize: "13px",
                lineHeight: "1.6",
                color: "var(--text-primary)",
              }}
            >
              {repoReview}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPage({ getAuthConfig, styles }) {
  const [reviewHistory, setReviewHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/api/history",
        getAuthConfig()
      );
      setReviewHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteOne = async (id) => {
    try {
      await axios.delete(
        `http://localhost:4000/api/history/${id}`,
        getAuthConfig()
      );
      fetchHistory();
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  const handleClearHistory = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to delete ALL your history?"
    );
    if (!confirmClear) return;

    try {
      await axios.delete(
        "http://localhost:4000/api/history",
        getAuthConfig()
      );
      fetchHistory();
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const downloadPDF = (item) => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("AI Code Review Report", 10, 10);

    doc.setFontSize(10);
    doc.text(`Date: ${new Date(item.createdAt).toLocaleString()}`, 10, 18);

    doc.text("Original Code:", 10, 30);
    doc.text(item.code.substring(0, 1500), 10, 38);

    let parsed = {};
    try {
      parsed = JSON.parse(item.review);
    } catch {
      parsed = { summary: item.review };
    }

    doc.text("AI Summary:", 10, 120);
    doc.text(parsed.summary?.substring(0, 1500) || "No summary", 10, 128);

    doc.save("AI_Code_Review.pdf");
  };

  return (
    <div style={styles.pageContainer} className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--text-primary)",
            }}
          >
            Review History
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              margin: "4px 0 0 0",
            }}
          >
            {reviewHistory.length} review{reviewHistory.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        {reviewHistory.length > 0 && (
          <button style={styles.buttonDanger} onClick={handleClearHistory}>
            Clear All
          </button>
        )}
      </div>

      {reviewHistory.length === 0 ? (
        <div style={styles.card}>
          <p
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "40px 20px",
            }}
          >
            No review history yet. Start by reviewing some code!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {reviewHistory.map((item) => {
            let parsed = {};
            try {
              parsed = JSON.parse(item.review);
            } catch {
              parsed = { summary: item.review };
            }

            return (
              <div key={item._id} style={styles.historyCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      style={styles.buttonSecondary}
                      onClick={() => downloadPDF(item)}
                    >
                      Download PDF
                    </button>
                    <button
                      style={styles.buttonDanger}
                      onClick={() => handleDeleteOne(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "8px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Code
                  </h4>
                  <pre
                    style={{
                      background: "var(--code-bg)",
                      color: "var(--text-primary)",
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      overflowX: "auto",
                      border: "1px solid var(--border)",
                      margin: 0,
                    }}
                  >
                    {item.code}
                  </pre>
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "8px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Summary
                  </h4>
                  <pre
                    style={{
                      background: "var(--result-bg)",
                      color: "var(--text-primary)",
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      whiteSpace: "pre-wrap",
                      border: "1px solid var(--border)",
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                  >
                    {parsed.summary}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============== MAIN APP ===============
function App() {
  const [user, setUser] = useState(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({}); // minimal flag to skip Auth
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "var(--bg)",
      color: "var(--text-primary)",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
      padding: 0,
      margin: 0,
    },
    pageContainer: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "20px",
    },
    mainRow: {
      display: "flex",
      gap: "16px",
      maxWidth: "1600px",
      margin: "0 auto",
      padding: "0 20px 0 20px",
    },
    card: {
      background: "var(--card-bg)",
      borderRadius: "8px",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      padding: "20px",
    },
    editorPanel: {
      background: "var(--card-bg)",
      borderRadius: "8px",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      padding: "20px",
      overflow: "hidden",
    },
    resultPanel: {
      background: "var(--card-bg)",
      borderRadius: "8px",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      padding: "20px",
      overflow: "hidden",
    },
    historyCard: {
      background: "var(--card-bg)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "16px",
      boxShadow: "var(--shadow-sm)",
    },
    buttonPrimary: {
      background: "var(--nav-active)",
      border: "none",
      color: "#ffffff",
      fontWeight: "600",
      borderRadius: "6px",
      padding: "8px 20px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s ease",
    },
    buttonSecondary: {
      background: "transparent",
      border: "1px solid var(--border)",
      color: "var(--text-primary)",
      fontWeight: "500",
      borderRadius: "6px",
      padding: "8px 16px",
      cursor: "pointer",
      fontSize: "13px",
      transition: "all 0.2s ease",
    },
    buttonDanger: {
      background: "var(--danger)",
      border: "none",
      color: "white",
      fontSize: "13px",
      fontWeight: "500",
      borderRadius: "6px",
      padding: "6px 14px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    refactorBar: {
      background: "var(--card-bg)",
      borderTop: "2px solid var(--border)",
      padding: "12px 20px",
      display: "flex",
      gap: "20px",
      alignItems: "flex-start",
      overflowX: "auto",
      overflowY: "hidden",
    },
  };

  if (!user) {
    return (
      <ThemeProvider>
        <Auth setUser={setUser} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div style={styles.page}>
          <Navbar styles={styles} onLogout={handleLogout} />

          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route
              path="/dashboard"
              element={<Dashboard getAuthConfig={getAuthConfig} styles={styles} />}
            />
            <Route
              path="/github-review"
              element={<GithubReview getAuthConfig={getAuthConfig} styles={styles} />}
            />
            <Route
              path="/history"
              element={<HistoryPage getAuthConfig={getAuthConfig} styles={styles} />}
            />
            <Route
              path="/profile"
              element={
                <Profile
                  getAuthConfig={getAuthConfig}
                  styles={styles}
                  onLogout={handleLogout}
                />
              }
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
