import React, { useRef, useState } from 'react';
import { Wand2, Loader2, FolderOpen, FileAudio, Check, AlertCircle } from 'lucide-react';
import { filesFromDrop, filesFromFolderInput, PickedFiles } from '../../lib/audioMeta';

export type AutoFillStatus = { kind: 'idle' | 'busy' | 'done' | 'error'; text?: string };

interface AutoFillDropProps {
  title: string;
  hint: string;
  status: AutoFillStatus;
  onFiles: (picked: PickedFiles) => void;
}

/**
 * Drop zone at the top of a form: drop an audio file or a whole folder and the
 * form fills itself from the tags and the file or folder name.
 */
export default function AutoFillDrop({ title, hint, status, onFiles }: AutoFillDropProps) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);
  const busy = status.kind === 'busy';

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');

  return (
    <div
      onDragEnter={(e) => { if (!hasFiles(e) || busy) return; e.preventDefault(); depth.current += 1; setOver(true); }}
      onDragOver={(e) => { if (!hasFiles(e) || busy) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDragLeave={(e) => { if (!hasFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        if (busy) return;
        filesFromDrop(e.dataTransfer).then((p) => { if (p.files.length) onFiles(p); });
      }}
      className={`rounded-xl border-2 border-dashed p-4 transition ${
        over ? 'border-purple-400 bg-purple-500/10' : 'border-white/[0.12] bg-white/[0.03]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
            {busy ? <Loader2 size={18} className="text-white animate-spin" aria-hidden="true" /> : <Wand2 size={18} className="text-white" aria-hidden="true" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{over ? 'Laat los om in te vullen' : title}</p>
            <p className="text-xs text-white/40 mt-0.5">{hint}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg bg-white/[0.08] text-white/80 hover:bg-white/[0.14] text-xs font-semibold disabled:opacity-50">
            <FileAudio size={14} aria-hidden="true" /> Bestand
          </button>
          <button type="button" disabled={busy} onClick={() => dirRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg bg-white/[0.08] text-white/80 hover:bg-white/[0.14] text-xs font-semibold disabled:opacity-50">
            <FolderOpen size={14} aria-hidden="true" /> Map
          </button>
        </div>
      </div>

      {status.text && (
        <p className={`mt-3 text-xs flex items-start gap-1.5 ${
          status.kind === 'error' ? 'text-amber-400' : status.kind === 'done' ? 'text-green-400' : 'text-white/60'
        }`}>
          {status.kind === 'done' && <Check size={12} className="mt-0.5 flex-shrink-0" aria-hidden="true" />}
          {status.kind === 'error' && <AlertCircle size={12} className="mt-0.5 flex-shrink-0" aria-hidden="true" />}
          <span>{status.text}</span>
        </p>
      )}

      <input ref={fileRef} type="file" multiple className="hidden"
        onChange={(e) => { const files = Array.from(e.target.files || []); e.target.value = ''; if (files.length) onFiles({ files }); }} />
      <input ref={dirRef} type="file" className="hidden" {...({ webkitdirectory: '', directory: '' } as any)}
        onChange={(e) => { const p = filesFromFolderInput(e.target.files); e.target.value = ''; if (p.files.length) onFiles(p); }} />
    </div>
  );
}
