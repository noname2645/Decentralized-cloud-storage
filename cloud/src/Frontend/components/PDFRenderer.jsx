import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Use unpkg CDN worker — mirrors npm exactly so any installed version is available.
// This avoids path resolution issues when served from Express or Vite dev server.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/* ─────────────────────────────────────────────────────────────────────────────
   PDFThumbnail
   Renders page 1 of a PDF onto a <canvas> — used inside file cards.
   Props:
     pdfBytes  – Uint8Array of the decrypted PDF
     width     – canvas render width in px (default 300)
   ───────────────────────────────────────────────────────────────────────────── */
export const PDFThumbnail = ({ pdfBytes, width = 300 }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pdfBytes) return;
    let cancelled = false;

    const render = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      } catch (err) {
        if (!cancelled) {
          console.error("PDFThumbnail render error:", err);
          setError(true);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [pdfBytes, width]);

  if (error) return null; // fall through to parent fallback

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   PDFFullViewer
   Renders all pages of a PDF in a scrollable container — used in the modal.
   Props:
     pdfBytes  – Uint8Array of the decrypted PDF
   ───────────────────────────────────────────────────────────────────────────── */
export const PDFFullViewer = ({ pdfBytes }) => {
  const containerRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pdfBytes) return;
    let cancelled = false;

    const renderAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const totalPages = pdf.numPages;
        const rendered = [];

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;

          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");

          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;

          rendered.push({
            id: i,
            dataUrl: canvas.toDataURL("image/png"),
            width: viewport.width,
            height: viewport.height,
          });
        }

        if (!cancelled) {
          setPages(rendered);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("PDFFullViewer render error:", err);
          setError(err.message || "Failed to render PDF");
          setLoading(false);
        }
      }
    };

    renderAll();
    return () => { cancelled = true; };
  }, [pdfBytes]);

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Rendering PDF pages…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorWrap}>
        <span style={{ fontSize: "2rem" }}>⚠️</span>
        <p style={styles.errorText}>Could not render PDF: {error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={styles.scrollContainer}>
      {pages.map((pg) => (
        <div key={pg.id} style={styles.pageWrap}>
          <img
            src={pg.dataUrl}
            alt={`Page ${pg.id}`}
            style={styles.pageImage}
            draggable={false}
          />
          <span style={styles.pageLabel}>Page {pg.id} / {pages.length}</span>
        </div>
      ))}
    </div>
  );
};

const styles = {
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "1rem",
    color: "#94a3b8",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid rgba(79,172,254,0.2)",
    borderTopColor: "#4facfe",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  errorWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "0.75rem",
    padding: "2rem",
    textAlign: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "0.95rem",
  },
  scrollContainer: {
    overflowY: "auto",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1rem",
    background: "#0a0e1a",
    alignItems: "center",
  },
  pageWrap: {
    position: "relative",
    width: "100%",
    maxWidth: "800px",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
  pageImage: {
    width: "100%",
    display: "block",
    userSelect: "none",
  },
  pageLabel: {
    position: "absolute",
    bottom: "0.5rem",
    right: "0.75rem",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.4)",
    background: "rgba(0,0,0,0.5)",
    padding: "2px 8px",
    borderRadius: "20px",
    backdropFilter: "blur(4px)",
  },
};
