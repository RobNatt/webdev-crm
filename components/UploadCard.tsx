"use client";

import { FormEvent } from "react";

type Props = {
  onUpload: (file: File) => Promise<void>;
  busy?: boolean;
};

export function UploadCard({ onUpload, busy }: Props) {
  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File)) return;
    await onUpload(file);
    event.currentTarget.reset();
  };

  return (
    <div className="card">
      <h3>Upload Leads CSV</h3>
      <p>Drop Google Maps lead CSV to ingest new leads.</p>
      <form className="row" onSubmit={handleUpload}>
        <input name="file" type="file" accept=".csv" required />
        <button type="submit" disabled={busy}>
          {busy ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
