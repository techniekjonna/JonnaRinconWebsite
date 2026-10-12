import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, AlertCircle, X, Upload, Loader2 } from 'lucide-react';
import { uploadToCloud } from '../../lib/cloudUpload';
import { toDirectUrl, detectUrlType, isValidUrl } from '../../lib/utils/urlUtils';

interface LinkInputProps {
  label: string;
  name: string;
  onChange: (url: string) => void;
  defaultValue?: string;
  type?: 'audio' | 'image' | 'any';
  required?: boolean;
  placeholder?: string;
  /**
   * Cloud folder (relative to "J18/Media Website") the Upload button sends the
   * file to. Created when missing. Defaults to "Uploads".
   */
  folder?: string;
  /** Optional file name (without extension) for the uploaded file. */
  baseName?: string;
  /** Optional custom upload handler; replaces the cloud upload. */
  onUpload?: (file: File) => void;
  /**
   * Called with the file before it is uploaded (e.g. to fill the form from its
   * tags). May return a folder and/or file name to use instead of the props.
   */
  onFile?: (file: File) => Promise<{ folder?: string; baseName?: string } | void> | { folder?: string; baseName?: string } | void;
}

export default function LinkInput({
  label,
  name,
  onChange,
  defaultValue = '',
  type = 'any',
  required = false,
  placeholder,
  folder,
  baseName,
  onUpload,
  onFile,
}: LinkInputProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedTo, setUploadedTo] = useState('');
  const [value, setValue] = useState(defaultValue);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);

  // Update value when defaultValue prop changes (e.g., when editing a beat)
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setError('');

    if (!newValue.trim()) {
      onChange('');
      return;
    }

    // Validate URL format
    if (!isValidUrl(newValue)) {
      setError('Invalid URL format');
      onChange('');
      return;
    }

    // Transform URL (add /download for Nextcloud if needed)
    const transformedUrl = toDirectUrl(newValue);
    onChange(transformedUrl);
  };

  const urlType = detectUrlType(value);
  const isValid = !value || isValidUrl(value);
  const transformedValue = toDirectUrl(value);
  const wasTransformed = value !== transformedValue;

  const getUrlTypeLabel = () => {
    if (!value) return '';
    switch (urlType) {
      case 'nextcloud':
        return 'Nextcloud/ownCloud';
      case 'firebase':
        return 'Firebase Storage';
      default:
        return 'Direct URL';
    }
  };

  const copyToClipboard = () => {
    if (transformedValue) {
      navigator.clipboard.writeText(transformedValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setValue('');
    onChange('');
    setError('');
  };

  const acceptAttr =
    type === 'audio' ? 'audio/*' : type === 'image' ? 'image/*' : undefined;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const fileMatchesType = (file: File) => {
    if (type === 'audio') return file.type.startsWith('audio/') || /\.(wav|mp3|aiff?|flac|m4a|ogg|aac)$/i.test(file.name);
    if (type === 'image') return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
    return true;
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file twice still fires onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    await uploadFile(file);
  };

  // Drag & drop: drop a file anywhere on the field + Upload button
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');
  const onDragEnter = (e: React.DragEvent) => {
    if (!hasFiles(e) || uploading) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!hasFiles(e) || uploading) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const onDrop = async (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!fileMatchesType(file)) {
      setError(type === 'audio' ? 'Dit is geen audiobestand. Sleep een audiobestand (wav, mp3, ...).' : 'Dit is geen afbeelding. Sleep een afbeelding (png, jpg, webp).');
      return;
    }
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (onUpload) {
      onUpload(file);
      return;
    }
    setUploading(true);
    setProgress(0);
    setError('');
    setUploadedTo('');
    try {
      let target: { folder?: string; baseName?: string } | void = undefined;
      if (onFile) {
        try { target = await onFile(file); } catch (e) { console.warn(e); }
      }
      const res = await uploadToCloud(file, {
        folder: target?.folder || folder || 'Uploads',
        baseName: target?.baseName ?? baseName,
        onProgress: setProgress,
      });
      setValue(res.url);
      onChange(res.url);
      setUploadedTo(res.path);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="space-y-2">
        <div
          className={`relative flex gap-2 rounded transition ${dragOver ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-black bg-white/[0.04]' : ''}`}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded border-2 border-dashed border-white/50 bg-black/70 text-white text-xs font-semibold uppercase tracking-wider">
              <Upload size={14} aria-hidden="true" /> Laat los om te uploaden
            </div>
          )}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder || 'https://example.com/audio/track.mp3'}
              className={`w-full bg-white/[0.05] border rounded px-4 py-2 text-white placeholder-white/40 transition-all ${
                error
                  ? 'border-red-500/50 focus:border-red-500'
                  : isValid
                    ? 'border-white/[0.1] focus:border-white/[0.3]'
                    : 'border-red-500/50 focus:border-red-500'
              } focus:outline-none focus:bg-white/[0.08]`}
              required={required}
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/60 transition"
                aria-label="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded bg-white/[0.08] border border-white/[0.1] text-white/80 hover:bg-white/[0.12] hover:text-white transition disabled:opacity-60 disabled:cursor-wait"
            title={`Upload to cloud: ${folder || 'Uploads'}`}
            aria-label="Upload file"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
              {uploading ? `${Math.round(progress * 100)}%` : 'Upload'}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
            onChange={handleFilePicked}
            className="hidden"
          />
        </div>

        {uploading && (
          <div className="h-1 w-full rounded bg-white/[0.08] overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-white/60 transition-all" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        )}
        {uploadedTo && !uploading && (
          <p className="text-xs text-green-400 flex items-center gap-1.5">
            <Check size={12} /> Uploaded to cloud: {uploadedTo}
          </p>
        )}

        {/* URL Info */}
        {value && isValid && (
          <div className="flex flex-col gap-2">
            {/* URL Type Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Type:</span>
              <span className="text-xs bg-white/[0.08] text-white/60 px-2 py-1 rounded">
                {getUrlTypeLabel()}
              </span>
            </div>

            {/* Transformation Notice */}
            {wasTransformed && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded px-3 py-2">
                <p className="text-xs text-blue-400">
                  ✓ URL will be transformed to add <code className="bg-black/30 px-1 rounded">/download</code>
                </p>
              </div>
            )}

            {/* Transformed URL Display */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/40 mb-1">Final URL:</p>
                <p className="text-xs text-white break-all font-mono">{transformedValue}</p>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex-shrink-0 p-1.5 hover:bg-white/[0.08] rounded transition text-white/40 hover:text-white/60"
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Help Text */}
        {!value && (
          <p className="text-xs text-white/30">
            {type === 'audio'
              ? 'Plak een link, klik op Upload of sleep een audiobestand hierheen'
              : type === 'image'
                ? 'Plak een link, klik op Upload of sleep een afbeelding hierheen'
                : 'Plak een link, klik op Upload of sleep een bestand hierheen'}
          </p>
        )}
      </div>
    </div>
  );
}
