import React from "react";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Universal Error Boundary for Q-RAKSHAK Medical Suite.
 * Catches runtime React rendering errors, WebGL / Three.js context losses,
 * and asynchronous UI faults with clear recovery actions in plain English.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Q-RAKSHAK ErrorBoundary] Component failure caught:", error, errorInfo);
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, "", cleanUrl);
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return typeof this.props.fallback === "function"
        ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
        : this.props.fallback;
    }

    const { compact = false, title, message } = this.props;
    const isWebGL =
      this.state.error?.message?.toLowerCase().includes("webgl") ||
      this.state.error?.message?.toLowerCase().includes("three") ||
      this.state.error?.message?.toLowerCase().includes("context lost");

    const displayTitle =
      title ||
      (isWebGL
        ? "Graphics display encountered an interruption"
        : "Something interrupted this view");

    const displayMessage =
      message ||
      (isWebGL
        ? "The 3D graphics hardware took a brief pause. You can restore the 3D twin or return to the main dashboard."
        : "We encountered a temporary display issue loading this section. Your medical records and account data remain completely safe.");

    if (compact) {
      return (
        <div
          role="alert"
          style={{
            padding: "16px 20px",
            background: "rgba(239, 68, 68, 0.04)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            margin: "8px 0",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#991B1B" }}>{displayTitle}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted, #64748B)" }}>{displayMessage}</div>
            </div>
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding: "6px 12px",
              background: "#FFFFFF",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              color: "#DC2626",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <RotateCcw size={13} />
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: "420px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
          background: "var(--bg-canvas, #FAFAF7)",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            width: "100%",
            background: "var(--card-bg, #FFFFFF)",
            border: "1px solid var(--border-subtle, #E2E8F0)",
            borderRadius: "14px",
            padding: "36px 32px",
            boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <AlertTriangle size={28} color="#DC2626" />
          </div>

          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary, #0F172A)",
              marginBottom: "8px",
            }}
          >
            {displayTitle}
          </h2>

          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: "var(--text-secondary, #475569)",
              marginBottom: "24px",
            }}
          >
            {displayMessage}
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={this.handleReset}
              style={{
                padding: "10px 18px",
                background: "var(--primary, #0EA5E9)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(14, 165, 233, 0.25)",
              }}
            >
              <RotateCcw size={15} />
              Try Again
            </button>

            <button
              onClick={this.handleGoHome}
              style={{
                padding: "10px 18px",
                background: "var(--card-bg, #FFFFFF)",
                color: "var(--text-primary, #0F172A)",
                border: "1px solid var(--border-subtle, #CBD5E1)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Home size={15} />
              Return to Dashboard
            </button>

            <button
              onClick={this.handleReload}
              style={{
                padding: "10px 16px",
                background: "transparent",
                color: "var(--text-muted, #64748B)",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>

          {/* Technical Diagnostics Accordion */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle, #F1F5F9)",
              textAlign: "left",
            }}
          >
            <button
              onClick={this.toggleDetails}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted, #94A3B8)",
                fontSize: "11px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {this.state.showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {this.state.showDetails ? "Hide technical diagnostic details" : "Show technical diagnostic details"}
            </button>

            {this.state.showDetails && (
              <pre
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  background: "#0F172A",
                  color: "#E2E8F0",
                  borderRadius: "8px",
                  fontSize: "11px",
                  overflowX: "auto",
                  maxHeight: "180px",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {this.state.error?.toString() || "Unknown error"}
                {"\n"}
                {this.state.errorInfo?.componentStack || ""}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }
}
