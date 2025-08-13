 'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

interface TimerLogEntry {
  id: string;
  title: string;
  seconds: number;
  startedAt: number;
  completedAt: number;
  color: string;
}

interface TitleGoals {
  targetSessions?: number;
  targetHours?: number;
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
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [isRestartHovered, setIsRestartHovered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [endMs, setEndMs] = useState<number | null>(null);
  const [frameTime, setFrameTime] = useState<number>(typeof performance !== 'undefined' ? performance.now() : 0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logs, setLogs] = useState<TimerLogEntry[]>([]);
  const [goals, setGoals] = useState<Record<string, TitleGoals>>({});
  const [minRange, setMinRange] = useState('');
  const [maxRange, setMaxRange] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const originalTitleRef = useRef<string | null>(null);
  const hasLoggedRef = useRef(false);
  const lastLogIdRef = useRef<string | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [selectedUpcomingGoalTitle, setSelectedUpcomingGoalTitle] = useState<string>('');
  const [isGoalPickerOpen, setIsGoalPickerOpen] = useState(false);
  const pendingAssignLogIdRef = useRef<string | null>(null);
  const [openGoalMenuTitle, setOpenGoalMenuTitle] = useState<string | null>(null);
  const [openLogMenuId, setOpenLogMenuId] = useState<string | null>(null);
  const [isTitleConfirmOpen, setIsTitleConfirmOpen] = useState(false);
  const [pendingSeconds, setPendingSeconds] = useState<number | null>(null);
  const [titleConfirmText, setTitleConfirmText] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
  };

  const exportData = () => {
    try {
      const payload = {
        version: '1',
        exportedAt: Date.now(),
        userName,
        logs,
        goals,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timer-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const handleImportChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { version?: string; logs?: TimerLogEntry[]; goals?: Record<string, TitleGoals>; userName?: string };
      const importedLogs = Array.isArray(data.logs) ? data.logs : [];
      const importedGoals = data.goals && typeof data.goals === 'object' ? data.goals : {};

      // Merge logs by id; prefer item with newer completedAt
      const byId: Record<string, TimerLogEntry> = {};
      [...logs, ...importedLogs].forEach(item => {
        const prev = byId[item.id];
        if (!prev || (item.completedAt ?? 0) > (prev.completedAt ?? 0)) {
          byId[item.id] = item;
        }
      });
      const mergedLogs = Object.values(byId).sort((a, b) => b.completedAt - a.completedAt);

      // Merge goals by title; imported overrides
      const mergedGoals: Record<string, TitleGoals> = { ...goals, ...importedGoals };

      setLogs(mergedLogs);
      setGoals(mergedGoals);
      showToast('Import complete', 'success');
      // reset input
      if (importFileRef.current) importFileRef.current.value = '';
    } catch {
      showToast('Import failed: invalid file', 'error');
    }
  };
  const words = [
    // Productivity
    'focus','study','work','code','write','grind','create','read','plan','finish','organise','build','research','clean','polish',
    // Fitness
    'run','lift','plank','stretch','train','squat','bench','deadlift','pushup','sweat','move','jog','cycle',
    // Wellness
    'meditate','breathe','chill','rest','reflect','unwind','relax','nap','reset','soak','zen',
    // Cooking / Domestic
    'cook','bake','boil','fry','brew','wash','vacuum','mop','dust','fold','shop','prep',
    // Fun
    'game','scroll','meme','vibe','party','sing','dance','jam','binge','paint','draw',
    // Funny / Absurd (short)
    'goon','punt','procrastinate','doomscroll','panic','schemin','yeet','touchgrass','manifest','simp','conquer','vanish','loaf',
    // Epic / Over-the-top (phrases)
    'conquer the galaxy','start my villain arc','invent a new colour','hack the Pentagon (in Minecraft)','control the weather','overthrow the government (peacefully)','find Atlantis','launch the doomsday device','ascend to godhood','break the space-time continuum',
    // Everyday but dramatic
    'clean… ugh','finally do the laundry','empty the dishwasher like a hero','make a coffee I don’t need','scroll endlessly','stare into the fridge','reorganise my sock drawer','water the plant that’s already dead','untangle my headphones (again)','Google symptoms I shouldn’t',
    // Fitness / Skill-based
    'master the worm','bench 200kg','run… to the fridge','beat my personal best (in napping)','learn the splits','juggle chainsaws (safely)','plank until I regret it','learn to moonwalk','win Olympic gold (in procrastination)','dunk on a 7-foot hoop',
    // Social / Work-life chaos
    'convince boss I’m busy','reply to emails from 2019','start my OnlyFans (for feet pics)','quit my job dramatically','join a pyramid scheme','become a LinkedIn thought leader','fake a Zoom freeze','network aggressively','start an inter-office feud','cyberstalk my ex’s dog',
    // Absurd / Internet-core
    'goon','speedrun Minecraft IRL','touch grass','yeet myself into orbit','simp publicly','invent a sandwich','1v1 God','recreate Shrek from memory','speedrun Wikipedia','become the main character'
  ];
  const timeExamples = [
    'E.g. 25m, 1:30:00, 90 sec',
    'E.g. 13s (speedrun to fridge)',
    'E.g. 40m (nap before regret)',
    'E.g. 2h (enough to question life choices)',
    'E.g. 69m (nice)',
    'E.g. 8h (the sleep I’ll never get)'
  ];
  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const [timePlaceholder] = useState<string>(() => pickRandom(timeExamples));
  const [wordIndex, setWordIndex] = useState(() => Math.floor(Math.random() * words.length));

  const parseTime = (input: string): number => {
    if (!input) return 0;
    const str = input.trim().toLowerCase();
    if (!str) return 0;

    // Friendly phrases / slang first
    const phraseMatchers: Array<{ regex: RegExp; seconds: number }> = [
      { regex: /\b(halfa|half\s*an?\s*hour|half\s*hour)\b/, seconds: 30 * 60 },
      { regex: /\b(half\s*(a\s*)?min(ute)?s?)\b/, seconds: 30 },
      { regex: /\b(quarter\s*(of\s*)?(an\s*)?hour|quarter\s*hour)\b/, seconds: 15 * 60 },
      { regex: /\b(three\s*quarters\s*(of\s*)?(an\s*)?hour|three\s*quarter\s*hour|3\/4\s*hour)\b/, seconds: 45 * 60 },
      { regex: /\b(a|one)\s*sec(ond)?s?\b/, seconds: 1 },
      { regex: /\b(a|one)\s*min(ute)?s?\b/, seconds: 60 },
      { regex: /\b(an|one)\s*hour\b/, seconds: 3600 },
      { regex: /\b(couple\s*of\s*min(ute)?s?|couple\s*mins?|coupla\s*mins?)\b/, seconds: 2 * 60 },
    ];
    for (const m of phraseMatchers) {
      if (m.regex.test(str)) return m.seconds;
    }

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
    let usedRandom = false;
    let totalSeconds = 0;

    const minProvided = !!minRange.trim();
    const maxProvided = !!maxRange.trim();
    if (minProvided || maxProvided) {
      if (!(minProvided && maxProvided)) {
        showToast('Provide both a min and max for the random range.', 'error');
        return;
      }
      const minSec = parseTime(minRange);
      const maxSec = parseTime(maxRange);
      if (!Number.isFinite(minSec) || !Number.isFinite(maxSec) || minSec <= 0 || maxSec <= 0 || maxSec <= minSec) {
        showToast('Invalid range. Try e.g. 30m to 2h.', 'error');
        return;
      }
      totalSeconds = Math.floor(minSec + Math.random() * (maxSec - minSec + 1));
      usedRandom = true;
    } else {
      if (!raw) {
        showToast("Enter a time (e.g., 25m or 1:30:00)", 'error');
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
      totalSeconds = parseTime(raw);
    }
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
      showToast("Invalid time (try 25m or 1:30:00)", 'error');
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

    if (usedRandom) {
      setTimeInput(formatTime(totalSeconds));
    }

    // Prompt for title if empty
    if (!titleInput.trim()) {
      setPendingSeconds(totalSeconds);
      const prompts: string[] = [
        "You forgot to name your timer, champ.",
        "A title helps you remember what this is for. Without it, future-you will be like, “Huh?” Are you sure you want to go in nameless?",
        "This timer has no name. Like a mysterious cowboy… but less cool.",
        "Titles give purpose. Yours has none. Did you mean to ride into the sunset without one?",
        "Your timer is currently called ‘¯\\_(ツ)_/¯’.",
        "Titles help you focus. Without one, you’re just winging it. Proceed without one, or nah?",
        "Untitled timers are like emails without subjects.",
        "They work, but no one’s happy about it. Are you sure you want to send this into the void?",
        "No title? No vibe.",
        "Give it a name and it’ll feel more official. Or keep it bland… your call. You sure about that?",
        "A title is your timer’s battle cry.",
        "Without it, you’re going in unarmed. Still want to charge into war without a sword?",
        "This timer is running undercover.",
        "A title blows its cover in style. Did you want to keep it anonymous?",
        "Even goldfish remember things for longer than an untitled timer.",
        "Name it now, or risk forgetting why you started. Are you sure you want to risk it?",
        "Your timer feels invisible.",
        "Titles make it seen. Do you really want to leave it in stealth mode?",
        "Naming your timer is free. Not naming it is a choice.",
        "And possibly a bad one. Still want to roll with it?"
      ];
      setTitleConfirmText(prompts[Math.floor(Math.random() * prompts.length)]);
      setIsTitleConfirmOpen(true);
      return;
    }

    setTitle(titleInput);
    setRemainingTime(totalSeconds);
    setTotalTime(totalSeconds);
    setIsRunning(true);
    setHasStarted(true);
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    setStartMs(now);
    setEndMs(now + totalSeconds * 1000);
    if (typeof document !== 'undefined' && originalTitleRef.current == null) {
      originalTitleRef.current = document.title;
    }
  };

  const restart = () => {
    setIsRunning(false);
    setIsFinished(false);
    setStartMs(null);
    setEndMs(null);
    setHasStarted(false);
    hasLoggedRef.current = false;
    lastLogIdRef.current = null;
    setToast(null);
    setTitleInput('');
    setTimeInput('');
    setMinRange('');
    setMaxRange('');
    setSelectedUpcomingGoalTitle('');
    setIsTitleConfirmOpen(false);
    setPendingSeconds(null);
    if (typeof document !== 'undefined') {
      document.title = 'This Is Timer';
    }
    originalTitleRef.current = null;
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
        setIsFinished(true);
        try {
          const audio = new Audio('/finish-chime.mp3');
          audio.play().catch(() => {});
        } catch {}
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, startMs, endMs]);

  // Live document title while running/finished (only after user clicks start)
  useEffect(() => {
    if (!hasStarted) return;
    if (typeof document === 'undefined') return;
    if (typeof document !== 'undefined' && document.hidden) return; // when hidden, let wall-clock updater own the title
    if (isRunning && startMs != null && endMs != null) {
      const remainingMs = Math.max(0, endMs - frameTime);
      const secs = Math.ceil(remainingMs / 1000);
      document.title = `${formatTime(secs)} — ${title || `time to ${words[wordIndex]}`}`;
      return;
    }
    if (isFinished) {
      document.title = `00:00:00 — ${title || `time to ${words[wordIndex]}`}`;
      return;
    }
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
  }, [frameTime, isRunning, isFinished, hasStarted, startMs, endMs, title, wordIndex]);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  // Clear toast when returning to setup screen
  useEffect(() => {
    if (!isRunning && !isFinished) setToast(null);
  }, [isRunning, isFinished]);

  // Auto-close any open ellipsis menus on outside click
  useEffect(() => {
    const closeMenus = () => {
      setOpenGoalMenuTitle(null);
      setOpenLogMenuId(null);
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('click', closeMenus);
      return () => document.removeEventListener('click', closeMenus);
    }
  }, []);

  // Background tab title updater (works even when rAF is throttled)
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      if (typeof document === 'undefined') return;
      if (document.hidden && isRunning && startMs != null && endMs != null) {
        // When hidden, base on wall-clock time so it doesn't drift back
        const nowTs = Date.now();
        const startTs = (typeof performance !== 'undefined' ? performance.timeOrigin + startMs : startMs);
        const endTs = (typeof performance !== 'undefined' ? performance.timeOrigin + endMs : endMs);
        const remainingMs = Math.max(0, endTs - nowTs);
        const secs = Math.ceil(remainingMs / 1000);
        document.title = `${formatTime(secs)} — ${title || `time to ${words[wordIndex]}`}`;
        return;
      }
      if (isFinished) {
        document.title = `00:00:00 — ${title || `time to ${words[wordIndex]}`}`;
        return;
      }
      if (originalTitleRef.current) document.title = originalTitleRef.current;
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, isRunning, isFinished, startMs, endMs, title, wordIndex, words]);

  // Load user, logs and goals from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedUser = localStorage.getItem('timer_userName');
      const savedLogs = localStorage.getItem('timer_logs_v1');
      const savedGoals = localStorage.getItem('timer_goals_v1');
      if (savedUser) setUserName(savedUser);
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      if (savedGoals) setGoals(JSON.parse(savedGoals));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('timer_logs_v1', JSON.stringify(logs)); } catch {}
  }, [logs]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('timer_goals_v1', JSON.stringify(goals)); } catch {}
  }, [goals]);

  // When finished, save a log entry once
  useEffect(() => {
    if (!isFinished || hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    if (!userName) return;
    const completedAt = Date.now();
    const startedAt = completedAt - totalTime * 1000;
    const entry: TimerLogEntry = {
      id: `${completedAt}-${Math.random().toString(36).slice(2, 8)}`,
      title: (selectedUpcomingGoalTitle && selectedUpcomingGoalTitle.trim()) ? selectedUpcomingGoalTitle.trim() : (title || `time to ${words[wordIndex]}`),
      seconds: totalTime,
      startedAt,
      completedAt,
      color: previewColor ?? themeColor,
    };
    lastLogIdRef.current = entry.id;
    setLogs(prev => [entry, ...prev].slice(0, 500));
  }, [isFinished, userName, totalTime, title, previewColor, themeColor, wordIndex, words, selectedUpcomingGoalTitle]);

  // Helper: determine if a hex color is light
  const isHexColorLight = (hex: string | null | undefined): boolean => {
    if (!hex) return false;
    let h = hex.replace('#', '').trim();
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    // Perceived luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 170; // slightly lower threshold so teal-ish hues use dark text
  };

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

  // Rotate animated hero words every 3 seconds (mix of sequential and random, no repeat)
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(prev => {
        if (words.length <= 1) return prev;
        const useSequential = Math.random() < 0.4; // 40% sequential, 60% random
        if (useSequential) {
          return (prev + 1) % words.length;
        }
        let next = prev;
        while (next === prev) next = Math.floor(Math.random() * words.length);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

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
        <div className={`global-toast toast-${toast.type}`} role="alert" aria-live="assertive" style={{
          color: 'white',
          padding: '14px 18px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>{toast.message}</span>
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
      {/* Celebratory effect when finished */}
      {isFinished && (() => {
        const bg = (isPickrOpen && previewColor) ? previewColor : themeColor;
        const light = isHexColorLight(bg);
        const textColor = light ? '#111' : '#fff';
        const subOpacity = light ? 0.85 : 0.9;
        return (
          <div aria-live="polite" style={{
            position: 'fixed',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            zIndex: 2,
            pointerEvents: 'auto'
          }}>
            <div className="celebrate-text" style={{
              textAlign: 'center',
              color: textColor,
              textShadow: light ? 'none' : `0 0 12px ${bg}66`,
              padding: '0 16px',
              maxWidth: 'min(92vw, 900px)'
            }}>
              <div style={{ fontSize: 'clamp(2rem, 8vw, 5rem)', fontWeight: 700 }}>Congrats!</div>
              <div style={{ fontSize: 'clamp(1.2rem, 4vw, 2.2rem)', opacity: subOpacity, marginTop: 6 }}>Well done — you crushed it.</div>
              <div style={{ fontSize: 'clamp(1rem, 3.5vw, 1.6rem)', opacity: subOpacity, marginTop: 4 }}>Deep breath. When you’re ready, go again.</div>

              <div style={{ marginTop: 16, fontFamily: 'Inter, sans-serif' }}>
                {userName ? (
                  <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ opacity: subOpacity }}>Add this session to a goal:</span>
                    <button onClick={() => { pendingAssignLogIdRef.current = lastLogIdRef.current; setIsGoalPickerOpen(true); }} style={{
                      background: 'transparent', color: textColor, border: `1px solid ${textColor}55`, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                    }}>Choose goal</button>
                  </div>
                ) : (
                  <div style={{ marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
                    <span style={{ opacity: subOpacity }}>Sign in to save and assign this session to a goal.</span>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => setIsAuthOpen(true)} style={{ background: bg, color: light ? '#000' : '#000', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Sign in</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <button onClick={restart} style={{
                  background: bg,
                  color: light ? '#000' : '#000',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 'clamp(1rem, 2.6vw, 1.15rem)',
                  boxShadow: '0 6px 0 rgba(0,0,0,0.25)'
                }}>Restart</button>
              </div>
            </div>
          </div>
        );
      })()}
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
          if (startMs == null || endMs == null) return 'scaleX(0)';
          if (isFinished) return 'scaleX(1)';
          if (!isRunning) return 'scaleX(0)';
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
        display: (isRunning || isFinished) ? 'none' : 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '2rem'
      }}>
        {/* Animated Hero: Time to <word> (theme-colored, italic, preview-aware) */}
        {/* Auth / Log controls */}
        <div style={{ position: 'fixed', top: 10, right: 10, display: 'flex', gap: 10 }}>
          <button
            onClick={() => setIsLogOpen(true)}
            style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}
          >{userName ? 'My Log' : 'View Log'}</button>
          <button
            onClick={() => setIsAuthOpen(true)}
            style={{ background: (isPickrOpen && previewColor) ? previewColor : themeColor, color: 'black', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}
          >{userName ? `Hi, ${userName}` : 'Sign in'}</button>
        </div>

        <h1 style={{
          marginBottom: '0.75rem',
          fontSize: 'clamp(2.2rem, 7vw, 4rem)',
          color: 'white',
          letterSpacing: '0.5px',
          textAlign: 'center'
        }}>
          <span style={{ display: 'block' }}>Time to</span>
          <span
            style={{
              position: 'relative',
              display: 'block',
              overflow: 'hidden',
              width: 'min(98vw, 1200px)',
              margin: '0 auto',
              minHeight: '2.2em'
            }}
          >
            {words.map((w, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, top: '-120%' }}
                transition={{ type: 'spring', stiffness: 50 }}
                animate={
                  wordIndex === index
                    ? { top: '0%', opacity: 1 }
                    : { top: wordIndex > index ? '-150%' : '150%', opacity: 0 }
                }
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: 'min(98vw, 1200px)',
                  padding: '0 8px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  textAlign: 'center',
                  color: (isPickrOpen && previewColor) ? previewColor : themeColor,
                  fontStyle: 'italic'
                }}
              >
                {w}
              </motion.span>
            ))}
          </span>
        </h1>
        
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter timer title"
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
          ref={titleInputRef}
        />

        <h1 style={{
          marginBottom: '0.5rem',
          fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
          color: 'white'
        }}>How much time you got?</h1>
        
        <input
          type="text"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={timePlaceholder}
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

        {/* Random range picker next to main input */}
        <div style={{ color: '#cfcfcf', opacity: 0.9, marginTop: '-0.2rem', marginBottom: '0.6rem', fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)' }}>
          Or have the random overlord decide your destiny.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: '0rem', marginBottom: '1.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="text"
            value={minRange}
            onChange={(e) => setMinRange(e.target.value)}
            placeholder="min e.g. 30m"
            style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${(isPickrOpen && previewColor) ? previewColor : themeColor}`, fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: 'white', textAlign: 'center', width: '36vw', maxWidth: '180px', outline: 'none', padding: '0.3rem 0' }}
          />
          <span style={{ color: '#aaa' }}>to</span>
          <input
            type="text"
            value={maxRange}
            onChange={(e) => setMaxRange(e.target.value)}
            placeholder="max e.g. 2h"
            style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${(isPickrOpen && previewColor) ? previewColor : themeColor}`, fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: 'white', textAlign: 'center', width: '36vw', maxWidth: '180px', outline: 'none', padding: '0.3rem 0' }}
          />
          <button onClick={() => {
            const lo = parseTime(minRange);
            const hi = parseTime(maxRange);
            if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= 0 || hi <= lo) {
              showToast('Enter a valid min and max (e.g., 30m to 2h)', 'error');
              return;
            }
            const secs = Math.floor(lo + Math.random() * (hi - lo + 1));
            setTimeInput(formatTime(secs));
          }} style={{ background: (isPickrOpen && previewColor) ? previewColor : themeColor, color: 'black', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>🎲 Random</button>
        </div>

        <div style={{
          color: '#cfcfcf',
          opacity: 0.9,
          marginTop: '0.4rem',
          marginBottom: '1.6rem',
          fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)'
        }}>No pause button. This isn’t Spotify Premium.</div>

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

      {/* Title confirmation modal */}
      {isTitleConfirmOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 70 }}>
          <div style={{ background: '#111', border: `2px solid ${previewColor ?? themeColor}`, borderRadius: 12, padding: 18, width: 'min(92vw, 700px)', color: 'white', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: 'clamp(1.05rem, 3.2vw, 1.25rem)', marginBottom: 12, lineHeight: 1.4 }}>{titleConfirmText}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => {
                setIsTitleConfirmOpen(false);
                setTimeout(() => titleInputRef.current?.focus(), 0);
              }} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Add a title</button>
              <button onClick={() => {
                const secs = pendingSeconds ?? 0;
                setIsTitleConfirmOpen(false);
                setPendingSeconds(null);
                // Start immediately without a title
                const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                setTitle(titleInput);
                setRemainingTime(secs);
                setTotalTime(secs);
                setIsRunning(true);
                setHasStarted(true);
                setStartMs(now);
                setEndMs(now + secs * 1000);
                if (typeof document !== 'undefined' && originalTitleRef.current == null) {
                  originalTitleRef.current = document.title;
                }
              }} style={{ background: (isPickrOpen && previewColor) ? previewColor : themeColor, color: '#000', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Start without title</button>
            </div>
          </div>
        </div>
      )}

      {/* Auth modal */}
      {isAuthOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
          <div style={{ background: '#111', border: `2px solid ${previewColor ?? themeColor}`, borderRadius: 12, padding: 18, width: 'min(92vw, 440px)', color: 'white', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>Sign in</div>
            <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: 12 }}>Save your timers to a log, track goals, and bask in achievement.</div>
            <input
              type="text"
              value={userName ?? ''}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter a name or handle"
              style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${(isPickrOpen && previewColor) ? previewColor : themeColor}`, marginBottom: '1.2rem', fontSize: '1.2rem', color: 'white', textAlign: 'left', width: '100%', outline: 'none', padding: '0.4rem 0' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setIsAuthOpen(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Close</button>
              <button onClick={() => {
                if (!userName || !userName.trim()) { showToast('Enter a name to sign in', 'error'); return; }
                try { localStorage.setItem('timer_userName', userName.trim()); } catch {}
                setIsAuthOpen(false);
              }} style={{ background: (isPickrOpen && previewColor) ? previewColor : themeColor, color: 'black', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Goal picker modal */}
      {isGoalPickerOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 70 }}>
          <div style={{ background: '#111', border: `2px solid ${previewColor ?? themeColor}`, borderRadius: 12, padding: 18, width: 'min(92vw, 520px)', color: 'white', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: 10 }}>Choose a goal</div>
            <div style={{ maxHeight: '50vh', overflow: 'auto', border: '1px solid #222', borderRadius: 8 }}>
              {Object.keys(goals).length === 0 && (
                <div style={{ padding: 12, opacity: 0.85 }}>No goals yet. Create one in your log.</div>
              )}
              {Object.keys(goals).map(g => (
                <button key={g} onClick={() => {
                  setSelectedUpcomingGoalTitle(g);
                  setIsGoalPickerOpen(false);
                  const id = pendingAssignLogIdRef.current ?? lastLogIdRef.current;
                  if (id) {
                    setLogs(prev => prev.map(l => l.id === id ? { ...l, title: g } : l));
                    showToast('Session assigned to goal', 'success');
                    pendingAssignLogIdRef.current = null;
                  }
                }}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', color: 'white', border: 'none', padding: '10px 12px', borderBottom: '1px solid #222', cursor: 'pointer' }}>
                  {g}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => setIsGoalPickerOpen(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Logs & Goals modal */}
      {isLogOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 60 }}>
          <div style={{ background: '#111', border: `2px solid ${previewColor ?? themeColor}`, borderRadius: 12, padding: 18, width: 'min(96vw, 900px)', maxHeight: '90vh', overflow: 'auto', color: 'white', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: '1.6rem' }}>{userName ? `${userName}’s Log` : 'Timer Log'}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input ref={importFileRef} type="file" accept="application/json" onChange={handleImportChange} style={{ display: 'none' }} />
                <button onClick={() => importFileRef.current?.click()} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Import</button>
                <button onClick={exportData} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Export</button>
                <button onClick={() => setIsLogOpen(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Close</button>
              </div>
            </div>

            {!userName && (
              <div style={{ background: '#222', border: '1px solid #333', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                Sign in to save sessions. Your past sessions will live on this device.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>Set a goal</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Which title? (e.g., conquer the galaxy)"
                    defaultValue={titleInput || title}
                    id="goal-title-input"
                    style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #444', color: 'white', fontSize: '1rem', padding: '6px 0', flex: '1 1 260px' }}
                  />
                  <input type="number" min={0} placeholder="# sessions" id="goal-sessions-input" style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #444', color: 'white', fontSize: '1rem', padding: '6px 0', width: 140 }} />
                  <input type="number" min={0} step="0.5" placeholder="hours" id="goal-hours-input" style={{ background: 'transparent', border: 'none', borderBottom: '2px solid #444', color: 'white', fontSize: '1rem', padding: '6px 0', width: 120 }} />
                  <button onClick={() => {
                    const t = (document.getElementById('goal-title-input') as HTMLInputElement | null)?.value?.trim() ?? '';
                    const sRaw = (document.getElementById('goal-sessions-input') as HTMLInputElement | null)?.value ?? '';
                    const hRaw = (document.getElementById('goal-hours-input') as HTMLInputElement | null)?.value ?? '';
                    if (!t) { showToast('Enter a title for your goal', 'error'); return; }
                    const s = sRaw ? Math.max(0, Math.floor(Number(sRaw))) : undefined;
                    const h = hRaw ? Math.max(0, Number(hRaw)) : undefined;
                    setGoals(prev => ({ ...prev, [t]: { targetSessions: s, targetHours: h } }));
                  }} style={{ background: (isPickrOpen && previewColor) ? previewColor : themeColor, color: 'black', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Save goal</button>
                </div>
              </div>

              <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '1.2rem' }}>Progress</div>
                  {Object.keys(goals).length > 0 && (
                    <button onClick={() => {
                      setGoals({});
                      showToast('Cleared all goals', 'success');
                    }} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Clear all</button>
                  )}
                </div>
                {Object.keys(goals).length === 0 && (
                  <div style={{ opacity: 0.8 }}>No goals yet. Set one above to start tracking.</div>
                )}
                {Object.entries(goals).map(([t, g]) => {
                  const sessions = logs.filter(l => l.title === t).length;
                  const hours = logs.filter(l => l.title === t).reduce((acc, l) => acc + l.seconds, 0) / 3600;
                  const pctSessions = g.targetSessions ? Math.min(100, (sessions / g.targetSessions) * 100) : undefined;
                  const pctHours = g.targetHours ? Math.min(100, (hours / g.targetHours) * 100) : undefined;
                  return (
                    <div key={t} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div>{t}</div>
                        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setOpenGoalMenuTitle(openGoalMenuTitle === t ? null : t)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: 8, cursor: 'pointer' }}>⋯</button>
                          {openGoalMenuTitle === t && (
                            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#111', border: '1px solid #222', borderRadius: 8, overflow: 'hidden', zIndex: 5 }}>
                              <button onClick={() => { const { [t]: _omit, ...rest } = goals; setGoals(rest); setOpenGoalMenuTitle(null); }} style={{ background: 'transparent', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Delete goal</button>
                            </div>
                          )}
                        </div>
                      </div>
                      {g.targetSessions != null && (
                        <div style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: 4 }}>{sessions} / {g.targetSessions} sessions</div>
                      )}
                      {g.targetSessions != null && (
                        <div style={{ background: '#1b1b1b', borderRadius: 999, overflow: 'hidden', height: 8, marginBottom: 6 }}>
                          <div style={{ width: `${pctSessions ?? 0}%`, height: '100%', background: (isPickrOpen && previewColor) ? previewColor : themeColor }}></div>
                        </div>
                      )}
                      {g.targetHours != null && (
                        <div style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: 4 }}>{hours.toFixed(1)} / {g.targetHours} hrs</div>
                      )}
                      {g.targetHours != null && (
                        <div style={{ background: '#1b1b1b', borderRadius: 999, overflow: 'hidden', height: 8 }}>
                          <div style={{ width: `${pctHours ?? 0}%`, height: '100%', background: (isPickrOpen && previewColor) ? previewColor : themeColor }}></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '1.2rem' }}>Recent timers</div>
                  {userName && logs.length > 0 && (
                    <button onClick={() => { setLogs([]); showToast('Cleared all timers', 'success'); }} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Clear all</button>
                  )}
                </div>
                {logs.length === 0 && <div style={{ opacity: 0.8 }}>No sessions yet. Go start one.</div>}
                {logs.slice(0, 12).map(l => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1f1f1f' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 999, background: l.color }}></div>
                      <div>
                        <div>{l.title}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{formatTime(l.seconds)} — {new Date(l.completedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setOpenLogMenuId(openLogMenuId === l.id ? null : l.id)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: 8, cursor: 'pointer' }}>⋯</button>
                      {openLogMenuId === l.id && (
                        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#111', border: '1px solid #222', borderRadius: 8, overflow: 'hidden', zIndex: 5 }}>
                          <button onClick={() => { setTitleInput(l.title); setTimeInput(formatTime(l.seconds)); setIsLogOpen(false); setOpenLogMenuId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: 'transparent', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Use</button>
                          {userName && <button onClick={() => { setSelectedUpcomingGoalTitle(l.title); setIsGoalPickerOpen(true); setOpenLogMenuId(null); }} style={{ background: 'transparent', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Count to goal…</button>}
                          <button onClick={() => { setLogs(prev => prev.filter(x => x.id !== l.id)); setOpenLogMenuId(null); }} style={{ background: 'transparent', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timer Screen */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: (isRunning || isFinished) ? 'flex' : 'none',
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
          color: isFinished ? (() => {
            const bg = (isPickrOpen && previewColor) ? previewColor : themeColor;
            return isHexColorLight(bg) ? '#111' : '#fff';
          })() : '#fff'
        }}>{(() => {
          if (startMs == null || endMs == null) return '0%';
          if (isFinished) return '100%';
          const duration = endMs - startMs;
          const elapsed = Math.min(duration, Math.max(0, frameTime - startMs));
          const pct = (elapsed / duration) * 100;
          return `${pct.toFixed(1)}%`;
        })()}</div>
        
        <button
          onClick={restart}
          onMouseEnter={() => setIsRestartHovered(true)}
          onMouseLeave={() => setIsRestartHovered(false)}
          aria-label="Restart"
          title="Restart"
          style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          fontSize: 'clamp(1.2rem, 3.5vw, 2.5rem)',
          color: (() => {
            const base = (isPickrOpen && previewColor) ? previewColor : themeColor;
            const baseText = '#fff';
            return isRestartHovered ? base : baseText;
          })(),
          cursor: 'pointer',
          zIndex: 3,
          display: (isRunning && !isFinished) ? 'block' : 'none',
          transition: 'color 0.2s ease',
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}>
          <FiRotateCw />
        </button>

        {/* restart hint removed */}
        
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(1.5rem, 6vw, 4rem)',
          zIndex: 3,
          textAlign: 'center',
          color: isFinished ? (() => {
            const bg = (isPickrOpen && previewColor) ? previewColor : themeColor;
            return isHexColorLight(bg) ? '#111' : '#fff';
          })() : '#fff'
        }}>{title}</div>
        
        {!isFinished && (
          <div className={isFinished ? 'timer-finished-blink' : ''} style={{
            fontSize: 'clamp(4rem, 20vw, 20rem)',
            marginTop: '2rem',
            color: isFinished ? (() => {
              const bg = (isPickrOpen && previewColor) ? previewColor : themeColor;
              return isHexColorLight(bg) ? '#111' : '#fff';
            })() : '#fff'
          }}>{(() => {
            if (!isRunning || startMs == null || endMs == null) return formatTime(remainingTime);
            const remainingMs = Math.max(0, endMs - frameTime);
            const secs = Math.ceil(remainingMs / 1000);
            return formatTime(secs);
          })()}</div>
        )}
      </div>
    </div>
  );
}
