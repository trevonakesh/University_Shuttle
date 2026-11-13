'use client';
import { useRef, useState } from 'react';
import { API_BASE, uploadImage } from '../lib/api';
import { useT } from '../lib/useLang';

// File picker that uploads immediately (same /api/upload endpoint the mobile
// sign-up uses) and reports the stored URL back to the form.
export default function PhotoField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (e: any) {
      setError(t(e.message ?? 'Upload failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
      {label}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => pick(e.target.files?.[0])}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            width: '64px', height: '64px', borderRadius: '8px', cursor: 'pointer',
            border: '1px dashed var(--surface-border)', background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${API_BASE}${value}`} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '22px', color: 'var(--text-muted)' }}>{uploading ? '…' : '+'}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{ fontSize: '12px', padding: '6px 10px' }}
          >
            {uploading ? t("Uploading…") : value ? t("Change") : t("Upload")}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer', padding: 0, textAlign: 'left' }}
            >
              {t("Remove")}
            </button>
          )}
        </div>
      </div>
      {error && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{error}</span>}
    </div>
  );
}
