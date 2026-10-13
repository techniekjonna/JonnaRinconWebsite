import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Beat } from '../../lib/firebase/types';
import { beatService } from '../../lib/firebase/services';
import { withAlpha } from '../../lib/coverColor';
import { useT } from '../../contexts/LanguageContext';

interface Props {
  beat: Beat;
  accent: string;
}

const PAGE = 5;
const EXTRA_MAX = 20; // 4 pages of 5

function toDirect(url: string): string {
  if (url && url.includes('/index.php/s/') && !url.endsWith('/download')) {
    return url.replace(/\/?$/, '/download');
  }
  return url;
}

const words = (s?: string) =>
  (s || '').toLowerCase().split(/[,/&]+|\s+/).map(w => w.trim()).filter(Boolean);

// Higher score = more alike: shared genre words and tags, close tempo, same key
function score(base: Beat, other: Beat): number {
  let s = 0;
  const g1 = new Set(words(base.genre));
  words(other.genre).forEach(w => { if (g1.has(w)) s += 4; });
  const t1 = new Set((base.tags || []).map(t => t.toLowerCase()));
  (other.tags || []).forEach(t => { if (t1.has(t.toLowerCase())) s += 1.5; });
  (other.mood || []).forEach(m => { if ((base.mood || []).includes(m)) s += 1; });
  if (base.bpm && other.bpm) {
    const d = Math.abs(base.bpm - other.bpm);
    const half = Math.min(d, Math.abs(base.bpm - other.bpm * 2), Math.abs(base.bpm * 2 - other.bpm));
    s += Math.max(0, 3 - half / 5);
  }
  if (base.key && other.key && base.key.toLowerCase() === other.key.toLowerCase()) s += 2;
  return s;
}

export default function SimilarBeats({ beat, accent }: Props) {
  const t = useT();
  const [all, setAll] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExtra, setShowExtra] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setShowExtra(false);
    setPage(0);
    beatService.getPublishedBeats().then(list => {
      if (alive) { setAll(list); setLoading(false); }
    });
    return () => { alive = false; };
  }, [beat.id]);

  const ranked = useMemo(
    () => all
      .filter(b => b.id !== beat.id && b.audioUrl)
      .map(b => ({ b, s: score(beat, b) + Math.random() * 0.5 }))
      .sort((a, z) => z.s - a.s)
      .map(x => x.b),
    [all, beat]
  );

  const top = ranked.slice(0, PAGE);
  const extra = ranked.slice(PAGE, PAGE + EXTRA_MAX);
  const pages = Math.ceil(extra.length / PAGE);
  const extraPage = extra.slice(page * PAGE, page * PAGE + PAGE);

  if (!loading && top.length === 0) return null;

  const Row = ({ b }: { b: Beat }) => (
    <Link
      to={`/shop/beats/${b.id}`}
      className="w-full flex items-center gap-4 px-4 py-3 border border-white/[0.06] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition-all group text-left min-h-[56px]"
    >
      <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden bg-white/10">
        {b.artworkUrl && <img src={toDirect(b.artworkUrl)} alt={b.title} loading="lazy" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={14} className="text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-white group-hover:text-white">{b.title}</p>
        <p className="text-white/40 text-xs truncate">
          {[b.genre, b.bpm ? `${b.bpm} BPM` : '', b.key].filter(Boolean).join(' · ')}
        </p>
      </div>
      <span
        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border flex-shrink-0"
        style={{ borderColor: withAlpha(accent, 0.4), color: accent, background: withAlpha(accent, 0.1) }}
      >
        Beat
      </span>
    </Link>
  );

  return (
    <section aria-labelledby="similar-title">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <h2 id="similar-title" className="text-white/40 text-xs uppercase tracking-widest">
          {t('Similar beats', 'Vergelijkbare beats')}
        </h2>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {top.map(b => <Row key={b.id} b={b} />)}
        </div>
      )}

      {!loading && extra.length > 0 && !showExtra && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowExtra(true)}
            className="inline-flex items-center gap-2 px-6 py-3 border text-white font-bold text-xs uppercase tracking-widest transition-all hover:bg-white/[0.06] rounded-full min-h-[44px]"
            style={{ borderColor: withAlpha(accent, 0.45) }}
          >
            <Sparkles size={14} style={{ color: accent }} />
            {t(`Find ${extra.length} more variations`, `Nog ${extra.length} variaties zoeken`)}
          </button>
        </div>
      )}

      {showExtra && extra.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">
              {t('More like this', 'Meer zoals deze')} · {page + 1}/{pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label={t('Previous', 'Vorige')}
                className="w-11 h-11 flex items-center justify-center border border-white/10 text-white/60 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                aria-label={t('Next', 'Volgende')}
                className="w-11 h-11 flex items-center justify-center border border-white/10 text-white/60 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {extraPage.map(b => <Row key={b.id} b={b} />)}
          </div>
        </div>
      )}
    </section>
  );
}
