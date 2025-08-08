 'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { FaPalette } from 'react-icons/fa';
import { FiRotateCw } from 'react-icons/fi';

interface ColorHexLike {
  toHEXA: () => { toString: () => string };
}

interface PickrInstance {
  show?: () => void;
  hide?: () => void;
  on: (event: string, cb: (color: unknown) => void) => void;
  destroyAndRemove?: () => void;
}

export default function Timer() {
  const [titleInput, setTitleInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [title, setTitle] = useState('');
  const [totalTime, setTotalTime] = useState(0); // kept for potential future use (e.g., display)
  const [themeColor, setThemeColor] = useState('#00ffff');
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [isPickrOpen, setIsPickrOpen] = useState(false);
  const pickrAnchorRef = useRef<HTMLDivElement | null>(null);
  const pickrInstanceRef = useRef<PickrInstance | null>(null);
  const pickrButtonRef = useRef<HTMLButtonElement | null>(null);
  const iconButtonRef = useRef<HTMLButtonElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const [isRestartHovered, setIsRestartHovered] = useState(false);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [endMs, setEndMs] = useState<number | null>(null);
  const [frameTime, setFrameTime] = useState<number>(typeof performance !== 'undefined' ? performance.now() : 0);
  const [toast, setToast] = useState<string | null>(null);

  const parseTime = (input: string): number => {
    if (!input) return 0;
    const str = input.trim().toLowerCase();
    if (!str) return 0;

    // Colon formats hh:mm(:ss)? or mm:ss
    if (str.includes(':')) {
      const parts = str.split(':').map(p => p.trim());
      if (parts.every(p => /^\d+$/.test(p))) {
        const nums = parts.map(p => parseInt(p, 10));
        let h = 0, m = 0, s = 0;
        if (nums.length === 3) [h, m, s] = nums as [number, number, number];
        else if (nums.length === 2) {
          // Treat as mm:ss
          [m, s] = nums as [number, number];
        }
        return h * 3600 + m * 60 + s;
      }
    }

    // Token formats like 1.5h, 90m, 45s, 1h 30m, 1h30m, etc.
    let seconds = 0;
    const regex = /([0-9]*\.?[0-9]+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)?/g;
    let match: RegExpExecArray | null;
    let matchedAny = false;
    while ((match = regex.exec(str)) !== null) {
      matchedAny = true;
      const value = parseFloat(match[1]);
      const unit = match[2];
      if (!unit) {
        // No unit provided: will decide later
        seconds += value * 60; // default to minutes
        continue;
      }
      if (/^h|hr|hrs|hour|hours$/.test(unit)) seconds += value * 3600;
      else if (/^m|min|mins|minute|minutes$/.test(unit)) seconds += value * 60;
      else if (/^s|sec|secs|second|seconds$/.test(unit)) seconds += value;
    }

    if (!matchedAny) return 0;
    return Math.floor(seconds);
  };

  const formatTime = (secs: number): string => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const startTimer = () => {
    const raw = timeInput.trim();
    if (!raw) {
      setToast("Please enter a time (e.g. 25, 25 min, 1:30:00, 90 sec).");
      // Keep toast visible on mobile: avoid focusing the input to prevent keyboard covering
      if (typeof window !== 'undefined') {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          (document.activeElement as HTMLElement | null)?.blur?.();
        } else {
          timeInputRef.current?.focus();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    const totalSeconds = parseTime(raw);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
      setToast("Invalid time. Try formats like 25, 25 min, 1h 30m, 1:30:00, or 90 sec.");
      if (typeof window !== 'undefined') {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          (document.activeElement as HTMLElement | null)?.blur?.();
        } else {
          timeInputRef.current?.focus();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setTitle(titleInput);
    setRemainingTime(totalSeconds);
    setTotalTime(totalSeconds);
    setIsRunning(true);
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    setStartMs(now);
    setEndMs(now + totalSeconds * 1000);
  };

  const restart = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      startTimer();
    }
  };

  // Smooth animation frame loop for progress and time
  useEffect(() => {
    if (!isRunning || startMs == null || endMs == null) return;
    let rafId = 0;
    const tick = (t: number) => {
      setFrameTime(t);
      if (t >= endMs) {
        setIsRunning(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, startMs, endMs]);

  // Initialize Pickr (nano theme) for color selection
  useEffect(() => {
    if (!pickrAnchorRef.current || pickrInstanceRef.current) return;
    let destroyed = false;
    (async () => {
      const Pickr = (await import('@simonwep/pickr')).default;
      if (destroyed) return;
      const instance = (Pickr as unknown as { create: (opts: unknown) => PickrInstance }).create({
        el: pickrAnchorRef.current as HTMLElement,
        theme: 'nano',
        default: themeColor,
        position: 'bottom-middle',
        swatches: ['#00ffff', '#ff00ff', '#00ff88', '#ffcc00', '#ff5555', '#6a5acd'],
        components: {
          preview: true,
          opacity: false,
          hue: true,
          interaction: {
            hex: true,
            input: true,
            save: true
          }
        }
      });
      pickrInstanceRef.current = instance;
      // Capture internal button for reliable toggling
      const btn = pickrAnchorRef.current?.querySelector?.('.pcr-button') as HTMLButtonElement | null;
      if (btn) pickrButtonRef.current = btn;
      instance.on('show', () => {
        setIsPickrOpen(true);
      });
      instance.on('hide', () => {
        setIsPickrOpen(false);
        setPreviewColor(null);
      });
      instance.on('change', (color: unknown) => {
        const hex = (color as ColorHexLike).toHEXA().toString();
        setPreviewColor(hex);
      });
      instance.on('save', (color: unknown) => {
        const hex = (color as ColorHexLike).toHEXA().toString();
        setThemeColor(hex);
        instance.hide?.();
      });
    })();
    return () => {
      destroyed = true;
      try {
        pickrInstanceRef.current?.destroyAndRemove?.();
      } catch {}
      pickrInstanceRef.current = null;
    };
  }, [pickrAnchorRef, themeColor]);

  return (
    <div style={{
      backgroundColor: '#1c1c1c',
      color: 'white',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      {toast && (
        <div className="global-toast" role="alert" aria-live="assertive" style={{
          background: 'rgba(190, 20, 30, 0.95)',
          border: '1px solid rgba(255, 120, 120, 0.9)',
          color: 'white',
          padding: '14px 18px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            style={{
              marginLeft: '12px',
              background: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Progress Bar */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        backgroundColor: (isPickrOpen && previewColor) ? previewColor : themeColor,
        transformOrigin: 'left center',
        transform: (() => {
          if (!isRunning || startMs == null || endMs == null) return 'scaleX(0)';
          const duration = endMs - startMs;
          const elapsed = Math.min(duration, Math.max(0, frameTime - startMs));
          const progress = elapsed / duration;
          return `scaleX(${progress})`;
        })(),
        willChange: 'transform',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* Setup Screen */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: isRunning ? 'none' : 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1 style={{
          marginBottom: '0.5rem',
          fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
          color: 'white'
        }}>What are you working on?</h1>
        
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="world domination etc."
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${(isPickrOpen && previewColor) ? previewColor : themeColor}`,
            marginBottom: '2.2rem',
            fontSize: 'clamp(1.2rem, 3.5vw, 2rem)',
            color: 'white',
            textAlign: 'center',
            width: '80vw',
            maxWidth: '400px',
            outline: 'none',
            padding: '0.4rem 0'
          }}
        />

        <h1 style={{
          marginBottom: '0.5rem',
          fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
          color: 'white'
        }}>How long are you working for?</h1>
        
        <input
          type="text"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="remember, rome wasn't built in a day"
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${(isPickrOpen && previewColor) ? previewColor : themeColor}`,
            marginBottom: '2.2rem',
            fontSize: 'clamp(1.2rem, 3.5vw, 2rem)',
            color: 'white',
            textAlign: 'center',
            width: '80vw',
            maxWidth: '400px',
            outline: 'none',
            padding: '0.4rem 0'
          }}
          ref={timeInputRef}
        />

        <button onClick={startTimer} style={{
          background: (isPickrOpen && previewColor) ? previewColor : themeColor,
          color: 'black',
          border: 'none',
          padding: '0.6rem 2rem',
          fontSize: 'clamp(1.1rem, 3.5vw, 2rem)',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}>Start</button>

        {/* Palette trigger + Pickr anchor (popover attaches here) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem', position: 'relative' }}>
          <button
            ref={iconButtonRef}
            onClick={() => {
              if (isPickrOpen) {
                pickrInstanceRef.current?.hide?.();
              } else if (pickrButtonRef.current) {
                pickrButtonRef.current.click();
              } else {
                pickrInstanceRef.current?.show?.();
              }
            }}
            aria-label="Choose color theme"
            title="Choose color theme"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: (isPickrOpen && previewColor) ? previewColor : themeColor,
              background: 'transparent',
              border: 'none',
              borderRadius: '9999px',
              padding: 8,
              cursor: 'pointer',
              zIndex: 4
            }}
          >
            <FaPalette size={22} />
          </button>

          {/* Invisible anchor so Pickr can position relative to the icon */}
          <div ref={pickrAnchorRef} style={{ position: 'absolute', top: '100%', left: 0 }} />
        </div>
      </div>

      {/* Timer Screen */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: !isRunning ? 'none' : 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          fontSize: 'clamp(1rem, 3.5vw, 2rem)',
          zIndex: 2,
          color: 'white'
        }}>{(() => {
          if (!isRunning || startMs == null || endMs == null) return '0%';
          const duration = endMs - startMs;
          const elapsed = Math.min(duration, Math.max(0, frameTime - startMs));
          const pct = (elapsed / duration) * 100;
          return `${pct.toFixed(1)}%`;
        })()}</div>
        
        <div
          onClick={restart}
          onMouseEnter={() => setIsRestartHovered(true)}
          onMouseLeave={() => setIsRestartHovered(false)}
          style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          fontSize: 'clamp(1.2rem, 3.5vw, 2.5rem)',
          color: isRestartHovered ? ((isPickrOpen && previewColor) ? previewColor : themeColor) : 'white',
          cursor: 'pointer',
          zIndex: 3,
          display: isRunning ? 'block' : 'none',
          transition: 'color 0.2s ease'
        }}>
          <FiRotateCw />
        </div>
        
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(1.5rem, 6vw, 4rem)',
          zIndex: 3,
          textAlign: 'center',
          color: 'white'
        }}>{title}</div>
        
        <div style={{
          fontSize: 'clamp(4rem, 20vw, 20rem)',
          marginTop: '2rem',
          color: 'white'
        }}>{(() => {
          if (!isRunning || startMs == null || endMs == null) return formatTime(remainingTime);
          const remainingMs = Math.max(0, endMs - frameTime);
          const secs = Math.ceil(remainingMs / 1000);
          return formatTime(secs);
        })()}</div>
      </div>
    </div>
  );
}
