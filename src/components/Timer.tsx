'use client';

import React from 'react';
import { useState, useEffect } from 'react';

export default function Timer() {
  const [titleInput, setTitleInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [title, setTitle] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [themeColor, setThemeColor] = useState('#00ffff');
  const [showPalette, setShowPalette] = useState(false);

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
      {/* Color palette trigger */}
      <div
        onClick={() => setShowPalette(prev => !prev)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '12px',
          fontSize: '1.8rem',
          zIndex: 5,
          color: 'white',
          cursor: 'pointer'
        }}
        aria-label="Choose color theme"
        title="Choose color theme"
      >
        <i className="fa-solid fa-palette"></i>
      </div>

      {/* Color palette panel */}
      {showPalette && (
        <div
          style={{
            position: 'fixed',
            top: '48px',
            right: '12px',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            gap: '10px',
            zIndex: 6
          }}
        >
          {['#00ffff', '#ff00ff', '#00ff88', '#ffcc00', '#ff5555', '#6a5acd'].map(color => (
            <button
              key={color}
              onClick={() => { setThemeColor(color); setShowPalette(false); }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: color === themeColor ? '2px solid white' : '2px solid transparent',
                backgroundColor: color,
                cursor: 'pointer'
              }}
              aria-label={`Set theme color ${color}`}
              title={color}
            />
          ))}
        </div>
      )}
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
        
        <div onClick={restart} style={{
          position: 'fixed',
          top: '50px',
          right: '12px',
          fontSize: '2.5rem',
          color: 'white',
          cursor: 'pointer',
          zIndex: 3,
          display: isRunning ? 'block' : 'none'
        }}>
          <i className="fa-solid fa-rotate-left"></i>
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
