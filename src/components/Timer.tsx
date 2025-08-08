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
  const [totalTime, setTotalTime] = useState(0);
  const [themeColor, setThemeColor] = useState('#00ffff');
  const pickrContainerRef = useRef<HTMLDivElement | null>(null);
  const pickrInstanceRef = useRef<PickrInstance | null>(null);
  const [isRestartHovered, setIsRestartHovered] = useState(false);

  const parseTime = (input: string): number => {
    const str = input.toLowerCase();
    let seconds = 0;
    const hrMatch = str.match(/(\d+)\s*hour/);
    const minMatch = str.match(/(\d+)\s*min/);
    const secMatch = str.match(/(\d+)\s*sec/);
    if (hrMatch) seconds += parseInt(hrMatch[1]) * 3600;
    if (minMatch) seconds += parseInt(minMatch[1]) * 60;
    if (secMatch) seconds += parseInt(secMatch[1]);
    if (!hrMatch && !minMatch && !secMatch) seconds = parseInt(str) * 60;
    return seconds;
  };

  const formatTime = (secs: number): string => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const startTimer = () => {
    const totalSeconds = parseTime(timeInput);
    if (totalSeconds <= 0) return;

    setTitle(titleInput);
    setRemainingTime(totalSeconds);
    setTotalTime(totalSeconds);
    setIsRunning(true);
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

  useEffect(() => {
    if (!isRunning || remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingTime]);

  // Initialize Pickr (nano theme) for color selection
  useEffect(() => {
    if (!pickrContainerRef.current || pickrInstanceRef.current) return;
    let destroyed = false;
    (async () => {
      const Pickr = (await import('@simonwep/pickr')).default;
      if (destroyed) return;
      const instance = (Pickr as unknown as { create: (opts: unknown) => PickrInstance }).create({
        el: pickrContainerRef.current as HTMLElement,
        theme: 'nano',
        default: themeColor,
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
      instance.on('change', (color: unknown) => {
        const hex = (color as ColorHexLike).toHEXA().toString();
        setThemeColor(hex);
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
  }, [pickrContainerRef, themeColor]);

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
      {/* Progress Bar */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        backgroundColor: themeColor,
        width: totalTime > 0 ? `${(((totalTime - remainingTime) / totalTime) * 100)}%` : '0%',
        transition: 'width 0.3s linear',
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
          fontSize: '2.2rem',
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
            borderBottom: `2px solid ${themeColor}`,
            marginBottom: '2.2rem',
            fontSize: '2rem',
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
          fontSize: '2.2rem',
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
            borderBottom: `2px solid ${themeColor}`,
            marginBottom: '2.2rem',
            fontSize: '2rem',
            color: 'white',
            textAlign: 'center',
            width: '80vw',
            maxWidth: '400px',
            outline: 'none',
            padding: '0.4rem 0'
          }}
        />

        <button onClick={startTimer} style={{
          background: themeColor,
          color: 'black',
          border: 'none',
          padding: '0.6rem 2rem',
          fontSize: '2rem',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}>Start</button>

        {/* Palette trigger + Pickr container (below Start) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem' }}>
          <button
            onClick={() => pickrInstanceRef.current?.show?.()}
            aria-label="Choose color theme"
            title="Choose color theme"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeColor,
              background: 'transparent',
              border: 'none',
              borderRadius: '9999px',
              padding: 8,
              cursor: 'pointer'
            }}
          >
            <FaPalette size={22} />
          </button>

          {/* Hidden anchor for Pickr; Pickr will attach its trigger here */}
          <div
            ref={pickrContainerRef}
            style={{ width: 0, height: 0, overflow: 'hidden' }}
            aria-hidden="true"
          />
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
          fontSize: '2rem',
          zIndex: 2,
          color: 'white'
        }}>{totalTime > 0 ? `${(((totalTime - remainingTime) / totalTime) * 100).toFixed(1)}%` : '0%'}</div>
        
        <div
          onClick={restart}
          onMouseEnter={() => setIsRestartHovered(true)}
          onMouseLeave={() => setIsRestartHovered(false)}
          style={{
          position: 'fixed',
          top: '50px',
          right: '12px',
          fontSize: '2.5rem',
          color: isRestartHovered ? themeColor : 'white',
          cursor: 'pointer',
          zIndex: 3,
          display: isRunning ? 'block' : 'none',
          transition: 'color 0.2s ease'
        }}>
          <FiRotateCw />
        </div>
        
        <div style={{
          position: 'fixed',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '4rem',
          zIndex: 3,
          textAlign: 'center',
          color: 'white'
        }}>{title}</div>
        
        <div style={{
          fontSize: '20rem',
          marginTop: '2rem',
          color: 'white'
        }}>{formatTime(remainingTime)}</div>
      </div>
    </div>
  );
}
