import { useState, useEffect, useRef } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const OW: React.CSSProperties = {
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

// Belt repeating text
const BELT_UNIT = '  JONNA RINCON™  ·  ARTIST  ·  AUDIO ENGINEER  ·  MUSIC PRODUCER  ·  ART  ·';
const BELT_TEXT = Array(8).fill(BELT_UNIT).join('');

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'fading'>('hidden');
  const doneRef = useRef(false);

  const dismiss = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('fading');
    setTimeout(() => onLoadingComplete(), 650);
  };

  useEffect(() => {
    // Tiny delay so the browser has painted before we fade in
    const show = setTimeout(() => setPhase('visible'), 60);
    const auto = setTimeout(dismiss, 4500);
    return () => { clearTimeout(show); clearTimeout(auto); };
  }, []);

  return (
    <div
      onClick={dismiss}
      style={{
        ...OW,
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: phase === 'visible' ? 1 : 0,
        transition: phase === 'fading' ? 'opacity 0.65s ease-in-out' : phase === 'visible' ? 'opacity 0.9s ease-out' : 'none',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      {/* Background photo */}
      <img
        src="/JEIGHTENESIS.jpg"
        alt=""
        aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
      />
      {/* Dark overlay — heavier for Off-White label contrast */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)' }} />

      {/* ── Main label container ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: 'min(92vw, 680px)',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
          border: '1.5px solid rgba(255,255,255,0.35)',
          borderRadius: 0,
        }}
      >
        {/* c/o line — Off-White attribution style */}
        <span
          style={{
            ...OW,
            display: 'block',
            fontSize: 'clamp(8px, 1.6vw, 11px)',
            fontWeight: 400,
            letterSpacing: '0.28em',
            color: 'rgba(255,255,255,0.38)',
            textTransform: 'uppercase',
            marginBottom: 'clamp(0.6rem, 2vw, 1.1rem)',
          }}
        >
          c/o JONNARINCON.COM
        </span>

        {/* ── "JONNA RINCON" — the Off-White quoted title ── */}
        <h1
          style={{
            ...OW,
            margin: 0,
            fontSize: 'clamp(2.6rem, 9.5vw, 8rem)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#ffffff',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          &quot;JONNA RINCON&quot;
        </h1>

        {/* Thin rule */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background: 'rgba(255,255,255,0.18)',
            margin: 'clamp(1rem, 3vw, 1.8rem) 0',
          }}
        />

        {/* Descriptor lines — Off-White "FOR WALKING" style */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(0.35rem, 1.2vw, 0.6rem)',
          }}
        >
          {[
            'DUTCH AND DOMINICAN ETHNICITY',
            'ARTIST · AUDIO ENGINEER · MUSIC PRODUCER · ART',
            'BORN IN NETHERLANDS, MAASTRICHT',
          ].map((line) => (
            <span
              key={line}
              style={{
                ...OW,
                display: 'block',
                fontSize: 'clamp(8px, 1.8vw, 12px)',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.48)',
              }}
            >
              {line}
            </span>
          ))}
        </div>

        {/* Inner corner marks — Off-White spec-sheet aesthetic */}
        {(['top-left','top-right','bottom-left','bottom-right'] as const).map((corner) => (
          <div
            key={corner}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderColor: 'rgba(255,255,255,0.55)',
              borderStyle: 'solid',
              ...(corner === 'top-left'     && { top: -1,    left: -1,    borderWidth: '2px 0 0 2px' }),
              ...(corner === 'top-right'    && { top: -1,    right: -1,   borderWidth: '2px 2px 0 0' }),
              ...(corner === 'bottom-left'  && { bottom: -1, left: -1,    borderWidth: '0 0 2px 2px' }),
              ...(corner === 'bottom-right' && { bottom: -1, right: -1,   borderWidth: '0 2px 2px 0' }),
            }}
          />
        ))}
      </div>

      {/* ── Industrial belt — Off-White signature diagonal stripe ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: 'min(92vw, 680px)',
          height: 'clamp(24px, 4vw, 32px)',
          marginTop: '0px',
          overflow: 'hidden',
          background: 'repeating-linear-gradient(-45deg, #F5C518 0px, #F5C518 10px, #000000 10px, #000000 20px)',
          borderLeft: '1.5px solid rgba(255,255,255,0.35)',
          borderRight: '1.5px solid rgba(255,255,255,0.35)',
          borderBottom: '1.5px solid rgba(255,255,255,0.35)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Scrolling belt text */}
        <div
          style={{
            ...OW,
            display: 'flex',
            whiteSpace: 'nowrap',
            animation: 'beltScroll 18s linear infinite',
            fontSize: 'clamp(7px, 1.4vw, 9px)',
            fontWeight: 900,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#000000',
            mixBlendMode: 'multiply',
          }}
        >
          {BELT_TEXT}
        </div>
      </div>

      {/* Click to continue hint */}
      <p
        style={{
          ...OW,
          position: 'absolute',
          bottom: 'clamp(1.5rem, 4vw, 2.5rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          fontSize: 'clamp(7px, 1.4vw, 9px)',
          fontWeight: 700,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
          margin: 0,
          whiteSpace: 'nowrap',
        }}
      >
        CLICK TO CONTINUE
      </p>

      <style>{`
        @keyframes beltScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
