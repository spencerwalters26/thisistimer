'use client';

import React from 'react';
import { useState, useEffect } from 'react';

export default function Timer() {
  const [titleInput, setTitleInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [title, setTitle] = useState('');

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
    <>
      <div id="progress-bar" style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        backgroundColor: 'cyan',
        width: isRunning ? `${((remainingTime / parseTime(timeInput)) * 100)}%` : '0%',
        transition: 'width 0.05s linear',
        zIndex: 0
      }}></div>

      <div className={`container ${isRunning ? 'hidden' : ''}`} id="setup">
        <h1 className="title-prompt">What are you working on?</h1>
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="world domination etc."
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid cyan',
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

        <h1 className="time-prompt">How long are you working for?</h1>
        <input
          type="text"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="remember, rome wasn't built in a day"
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid cyan',
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
          fontFamily: 'Bebas Neue, sans-serif',
          background: 'cyan',
          color: 'black',
          border: 'none',
          padding: '0.6rem 2rem',
          fontSize: '2rem',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}>Start</button>
      </div>

      <div className={`container ${!isRunning ? 'hidden' : ''}`} id="timerScreen">
        <div id="percentage" style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          fontSize: '2rem',
          zIndex: 2
        }}>{isRunning ? `${((remainingTime / parseTime(timeInput)) * 100).toFixed(1)}%` : '0%'}</div>
        
        <div id="restart" onClick={restart} style={{
          position: 'fixed',
          top: '30px',
          right: '40px',
          fontSize: '2.5rem',
          color: 'white',
          cursor: 'pointer',
          zIndex: 3,
          display: 'block'
        }}>
          <i className="fa-solid fa-rotate-left"></i>
        </div>
        
        <div id="timer-title" style={{
          position: 'fixed',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '4rem',
          zIndex: 3,
          textAlign: 'center'
        }}>{title}</div>
        
        <div id="timer" style={{
          fontSize: '20rem',
          marginTop: '2rem'
        }}>{formatTime(remainingTime)}</div>
      </div>
    </>
  );
}
