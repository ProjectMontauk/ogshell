"use client";

import React from "react";

export type EvidenceFormProps = {
  side: "yes" | "no";
  onSideChange: (s: "yes" | "no") => void;
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  url: string;
  onUrlChange: (v: string) => void;
  uploadType: "url" | "pdf";
  onUploadTypeChange: (t: "url" | "pdf") => void;
  selectedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  /** The page's evidence message (sign-in prompt, success or error), shown above Submit as on the original. */
  message: string | null;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EvidenceForm(p: EvidenceFormProps) {
  return (
    <form className="flex flex-col gap-5" onSubmit={p.onSubmit} noValidate>
      <div>
        <span className="label">Evidence Type</span>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-yes" data-selected={p.side === "yes"} onClick={() => p.onSideChange("yes")}>
            Yes Evidence
          </button>
          <button type="button" className="btn btn-no" data-selected={p.side === "no"} onClick={() => p.onSideChange("no")}>
            No Evidence
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="evidence-title" className="label">
          Title
        </label>
        <input
          id="evidence-title"
          type="text"
          placeholder="e.g., CIA Memo dated Sept 1963"
          value={p.title}
          onChange={(e) => p.onTitleChange(e.target.value)}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="evidence-description" className="label">
          Description (Optional)
        </label>
        <textarea
          id="evidence-description"
          placeholder="Provide additional context or details about this evidence..."
          value={p.description}
          onChange={(e) => p.onDescriptionChange(e.target.value)}
          rows={3}
          className="field-area"
        />
      </div>

      <div>
        <span className="label">Document Source</span>
        <div role="tablist" aria-label="Document Source" className="seg mb-2">
          {(["url", "pdf"] as const).map((t) => (
            <button key={t} role="tab" type="button" aria-selected={p.uploadType === t} data-selected={p.uploadType === t} onClick={() => p.onUploadTypeChange(t)} className="seg-item">
              {t === "url" ? "URL Link" : "PDF Upload"}
            </button>
          ))}
        </div>
        {p.uploadType === "url" ? (
          <input id="evidence-url" type="text" placeholder="Enter the URL of the document..." value={p.url} onChange={(e) => p.onUrlChange(e.target.value)} className="field" aria-label="URL Link" />
        ) : (
          <div>
            <input
              id="evidence-file"
              type="file"
              accept=".pdf"
              onChange={p.onFileChange}
              className="block w-full text-small text-muted file:mr-3 file:h-8 file:rounded-control file:border-0 file:bg-surface-2 file:px-3 file:text-small file:font-medium file:text-ink hover:file:bg-hairline"
              aria-label="PDF Upload"
            />
            <p className="mt-1.5 text-small text-muted">Maximum file size: 10MB</p>
            {p.selectedFile && (
              <p className="mt-1 text-small text-ink">
                ✓ Selected: {p.selectedFile.name} <span className="num text-muted">({(p.selectedFile.size / (1024 * 1024)).toFixed(1)}MB)</span>
              </p>
            )}
          </div>
        )}
      </div>

      {p.message && (
        <p role="status" className="text-small font-semibold text-ink">
          {p.message}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={p.isUploading} className="btn btn-primary btn-lg">
          {p.isUploading ? "Uploading..." : "Submit Document"}
        </button>
      </div>
    </form>
  );
}
