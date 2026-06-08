import { useEffect, useMemo } from "react";
import { FileText, ExternalLink } from "lucide-react";

/** Data URL (base64) → blob URL, supaya iframe PDF render andal di semua browser. */
function dataUrlToBlobUrl(dataUrl: string): string {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "application/pdf";
  const bin = atob(b64 ?? "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], { type: mime }));
}

export function PdfPreview({
  dataUrl,
  fileName,
  height = 460,
}: {
  dataUrl: string;
  fileName?: string;
  height?: number;
}) {
  const blobUrl = useMemo(() => dataUrlToBlobUrl(dataUrl), [dataUrl]);
  useEffect(() => () => URL.revokeObjectURL(blobUrl), [blobUrl]);

  return (
    <div>
      <div className="sh-row sh-row--between" style={{ marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <div className="sh-row" style={{ gap: 8 }}>
          <FileText size={16} style={{ color: "var(--status-failed)" }} />
          <span style={{ fontWeight: 600 }}>{fileName || "Dokumen proposal.pdf"}</span>
        </div>
        <a
          href={blobUrl}
          target="_blank"
          rel="noreferrer"
          className="sh-btn sh-btn--ghost sh-btn--sm"
        >
          <ExternalLink size={14} />
          Buka di tab baru
        </a>
      </div>
      <iframe
        title="Preview dokumen proposal"
        src={blobUrl}
        style={{
          width: "100%",
          height,
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          background: "var(--canvas-soft)",
        }}
      />
    </div>
  );
}
