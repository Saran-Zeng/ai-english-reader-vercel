"use client";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="brand-mark">
          <span>AI</span>
        </div>

        <div className="brand-copy">
          <div className="brand-name">
            AI English Reader
          </div>

          <div className="brand-subtitle">
            Read · Understand · Improve
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-status">
          <span className="status-dot" />
          <span>Learning Mode</span>
        </div>
      </div>
    </header>
  );
}
