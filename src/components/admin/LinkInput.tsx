import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertCircle, X } from 'lucide-react';
import { toDirectUrl, detectUrlType, isValidUrl } from '../../lib/utils/urlUtils';

interface LinkInputProps {
  label: string;
  name: string;
  onChange: (url: string) => void;
  defaultValue?: string;
  type?: 'audio' | 'image' | 'any';
  required?: boolean;
  placeholder?: string;
}

export default function LinkInput({
  label,
  name,
  onChange,
  defaultValue = '',
  type = 'any',
  required = false,
  placeholder,
}: LinkInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="space-y-2">
        <div className="relative">
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
            >
              <X size={16} />
            </button>
          )}
        </div>

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
              ? 'Paste your audio URL from Nextcloud, Firebase Storage, or any other server'
              : type === 'image'
                ? 'Paste your cover art URL from Nextcloud, Firebase Storage, or any other server'
                : 'Paste the URL to your file'}
          </p>
        )}
      </div>
    </div>
  );
}
