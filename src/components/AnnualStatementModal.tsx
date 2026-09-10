import { useState, useEffect, useRef } from "react";
import { X, Printer, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import {
  type AnnualStatementDetails,
  buildAnnualStatementHtml,
  printAnnualStatement,
} from "../lib/printEngine";
import { useToast } from "../lib/toast";

interface AnnualStatementModalProps {
  statement: AnnualStatementDetails | null;
  onClose: () => void;
}

export default function AnnualStatementModal({ statement, onClose }: AnnualStatementModalProps) {
  const { showToast } = useToast();
  const [printing, setPrinting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.68);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!statement) return;
    setLoading(true);

    buildAnnualStatementHtml(statement).then((html) => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(html);
      doc.close();
      iframe.onload = () => setLoading(false);
      setTimeout(() => setLoading(false), 900);
    });
  }, [statement]);

  if (!statement) return null;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printAnnualStatement(statement);
      showToast("Annual statement sent to printer / PDF dialog.", "success");
    } catch (err) {
      console.error(err);
      showToast("Print failed. Please check browser permissions.", "error");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl my-auto flex flex-col bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#12122b] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-sm tracking-wide">
              Annual Statement Preview — {statement.year}
            </span>
            <span className="text-white/40 text-xs hidden sm:block">
              Exact preview of what will be printed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg px-1 py-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.35, +(z - 0.1).toFixed(2)))}
                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-white/50 text-xs font-mono w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))}
                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(0.68)}
                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Reset zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f5e6b3] to-[#c5961d] text-[#0c1b33] font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{printing ? "Preparing…" : "Print / Save PDF"}</span>
              <span className="sm:hidden">{printing ? "…" : "Print"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="relative overflow-auto bg-[#2a2a3e]" style={{ minHeight: "520px", maxHeight: "75vh" }}>
          <div className="flex justify-center py-6 px-4">
            <div
              className="relative shadow-2xl shadow-black/60"
              style={{ width: `${Math.round(794 * zoom)}px` }}
            >
              {loading && (
                <div
                  className="absolute inset-0 z-10 bg-white flex items-center justify-center rounded"
                  style={{ height: `${Math.round(1123 * zoom)}px` }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[#64748b] text-xs font-medium">Rendering statement…</span>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                title="Annual Statement Preview"
                sandbox="allow-same-origin"
                style={{
                  width: "794px",
                  height: "1123px",
                  border: "none",
                  display: "block",
                  transformOrigin: "top left",
                  transform: `scale(${zoom})`,
                  background: "#ffffff",
                }}
              />
              <div style={{ height: `${Math.round(1123 * zoom)}px` }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#12122b] border-t border-white/10 text-white/40 text-xs shrink-0">
          <span>What you see is exactly what will be printed / saved as PDF.</span>
          <span className="hidden sm:block">A4 Portrait · Tax Year {statement.year}</span>
        </div>
      </div>
    </div>
  );
}
