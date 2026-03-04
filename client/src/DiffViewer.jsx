import React, { useMemo } from "react";
import "./DiffViewer.css";

function DiffViewer({ oldCode, newCode }) {
  // Parse the diff to extract issues and fixes
  const { issues, fixes } = useMemo(() => {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    
    const detectedIssues = [];
    const appliedFixes = [];
    
    // Simple line-by-line comparison to find changes
    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i >= oldLines.length) {
        // Added lines at the end
        appliedFixes.push({
          oldLine: null,
          newLine: newLines[j],
          lineNum: j + 1,
          explanation: "New code added"
        });
        j++;
      } else if (j >= newLines.length) {
        // Removed lines at the end
        detectedIssues.push(`Line ${i + 1}: Removed code`);
        appliedFixes.push({
          oldLine: oldLines[i],
          newLine: null,
          lineNum: i + 1,
          explanation: "Code removed"
        });
        i++;
      } else if (oldLines[i] === newLines[j]) {
        // Lines match, move forward
        i++;
        j++;
      } else {
        // Lines differ - this is a change
        const issueDesc = `Line ${i + 1}: ${oldLines[i].trim() || '(empty line)'}`;
        detectedIssues.push(issueDesc);
        
        appliedFixes.push({
          oldLine: oldLines[i],
          newLine: newLines[j],
          lineNum: i + 1,
          explanation: "Code improved"
        });
        i++;
        j++;
      }
    }
    
    return { issues: detectedIssues, fixes: appliedFixes };
  }, [oldCode, newCode]);

  return (
    <div className="diff-viewer-container">
      <div className="inline-diff-wrapper">
        {/* Issues Detected Section */}
        <div className="issues-section">
          <h4 className="section-header">Issues Detected</h4>
          {issues.length > 0 ? (
            <ul className="issues-list">
              {issues.map((issue, idx) => (
                <li key={idx} className="issue-item">
                  <span className="icon-error">❌</span>
                  <span className="issue-text">{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-changes">No issues detected</p>
          )}
        </div>

        {/* Fixes Applied Section */}
        <div className="fixes-section">
          <h4 className="section-header">Fixes Applied</h4>
          {fixes.length > 0 ? (
            <div className="fixes-list">
              {fixes.map((fix, idx) => (
                <div key={idx} className="fix-card">
                  {fix.oldLine !== null && (
                    <div className="code-line removed">
                      <span className="icon-error">❌</span>
                      <code className="code-content">{fix.oldLine}</code>
                    </div>
                  )}
                  {fix.newLine !== null && (
                    <div className="code-line added">
                      <span className="icon-success">✅</span>
                      <code className="code-content">{fix.newLine}</code>
                    </div>
                  )}
                  <p className="fix-explanation">{fix.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-changes">No fixes applied</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiffViewer;
