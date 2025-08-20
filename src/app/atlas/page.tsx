"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  canonicalize,
  getCountriesByFirstLetter,
  getCountryById,
  getRandomAvailableLetter,
  resolveAlias,
  type Country,
} from "@/lib/atlas-data";
import "./retro.css";

type GameMode = 'timed-60' | 'timed-90' | 'timed-180' | 'endless';

function MusicPlayer() {
	const [playing, setPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleFirstInteraction = () => {
			window.removeEventListener('click', handleFirstInteraction);
			window.removeEventListener('keydown', handleFirstInteraction);
			audio.play().then(() => setPlaying(true)).catch(err => console.warn("Autoplay after interaction failed:", err));
		};

		audio.play()
			.then(() => setPlaying(true))
			.catch(() => {
				setPlaying(false);
				window.addEventListener('click', handleFirstInteraction);
				window.addEventListener('keydown', handleFirstInteraction);
			});
        
		return () => {
			window.removeEventListener('click', handleFirstInteraction);
			window.removeEventListener('keydown', handleFirstInteraction);
		};
	}, []);

	const togglePlay = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (playing) {
			audio.pause();
			setPlaying(false);
		} else {
			audio.play().then(() => setPlaying(true)).catch(e => console.error("Audio play failed on click:", e));
		}
	};

	return (
		<div className="music-player-container">
			<audio ref={audioRef} src="https://www.freesoundslibrary.com/wp-content/uploads/2018/05/retro-video-game-music.mp3" loop preload="auto" />
			<button onClick={togglePlay} className="music-toggle-btn" title="Toggle Background Music">
				<span className="blink">🎵</span> {playing ? "Mute" : "Play"}
			</button>
		</div>
	);
}

function GameModeDialog({ onSelectMode }: { onSelectMode: (mode: GameMode) => void }) {
	return (
		<div className="mode-dialog-overlay">
			<div className="mode-dialog">
				<h2 className="mode-dialog-title blink">🎮 SELECT GAME MODE 🎮</h2>
				<div className="mode-options">
					<button className="mode-button" onClick={() => onSelectMode('timed-60')}>
						<div className="mode-icon">⏳</div>
						<div className="mode-name">Speed Mode</div>
						<div className="mode-desc">60 seconds</div>
					</button>
					<button className="mode-button" onClick={() => onSelectMode('timed-90')}>
						<div className="mode-icon">⏰</div>
						<div className="mode-name">Classic Mode</div>
						<div className="mode-desc">90 seconds</div>
					</button>
					<button className="mode-button" onClick={() => onSelectMode('timed-180')}>
						<div className="mode-icon">🕐</div>
						<div className="mode-name">Marathon Mode</div>
						<div className="mode-desc">180 seconds</div>
					</button>
					<button className="mode-button" onClick={() => onSelectMode('endless')}>
						<div className="mode-icon">♾️</div>
						<div className="mode-name">Endless Mode</div>
						<div className="mode-desc">No time limit</div>
					</button>
				</div>
			</div>
		</div>
	);
}

function lastLetterFromCanonical(canonical: string): string | null {
  const m = canonical.match(/[a-z](?=[^a-z]*$)/);
  return m ? m[0] : null;
}

function lastLetterOfCountry(country: Country): string | null {
  const canonical = canonicalize(country.displayName);
  return lastLetterFromCanonical(canonical);
}

function pickComputerMove(requiredLetter: string, usedIds: Set<string>): Country | null {
  const candidates = getCountriesByFirstLetter(requiredLetter).filter(
    (c) => !usedIds.has(c.id)
  );
  if (candidates.length === 0) return null;
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  return choice;
}

export default function AtlasRetroPage() {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [requiredLetter, setRequiredLetter] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<
    { by: "you" | "cpu"; country: Country, status: 'ok' | 'rejected' }[]
  >([]);
  const [status, setStatus] = useState<{ text: string; type: "info" | "success" | "error" | "warning" }>({ text: "Select game mode to begin!", type: "info" });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [streak, setStreak] = useState(0);
  const [skipsLeft, setSkipsLeft] = useState(3);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [lastPlayerMove, setLastPlayerMove] = useState<Country | null>(null);
  const [lastCpuMove, setLastCpuMove] = useState<Country | null>(null);
  const [bigFeedback, setBigFeedback] = useState<{ text: string; type: 'correct' | 'wrong' | 'win' | 'lose' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const correctSoundRef = useRef<HTMLAudioElement>(null);
  const wrongSoundRef = useRef<HTMLAudioElement>(null);

  const getGameDuration = (mode: GameMode) => {
    switch (mode) {
      case 'timed-60': return 60;
      case 'timed-90': return 90;
      case 'timed-180': return 180;
      case 'endless': return Infinity;
      default: return 90;
    }
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    const start = getRandomAvailableLetter();
    const duration = getGameDuration(mode);
    setRequiredLetter(start);
    setUsedIds(new Set());
    setHistory([]);
    setStatus({ text: "Type a country name to begin!", type: "info" });
    setGameOver(false);
    setGameStarted(false);
    setTimeLeft(duration);
    setStreak(0);
    setSkipsLeft(3);
    setInput("");
    setCpuThinking(false);
    setLastPlayerMove(null);
    setLastCpuMove(null);
    setBigFeedback(null);
    if (timerRef.current) clearInterval(timerRef.current);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver && gameMode !== 'endless') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameOver(true);
            setBigFeedback({ text: "GAME OVER", type: "lose" });
            setStatus({ text: "Time's up!", type: "error" });
            return 0;
          }
          if (prev <= 11) {
            setStatus({ text: "Time's almost up!", type: "warning" });
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameOver, gameMode]);

  const handlePlayerInput = (value: string) => {
    if (!gameStarted && value.trim().length > 0) {
      setGameStarted(true);
    }
    setInput(value);
  };

  const playSound = (sound: 'correct' | 'wrong') => {
    const ref = sound === 'correct' ? correctSoundRef : wrongSoundRef;
    if (ref.current) {
      ref.current.currentTime = 0;
      ref.current.play().catch(e => console.error("SFX play failed:", e));
    }
  }

  const showBigFeedback = (text: string, type: 'correct' | 'wrong' | 'win' | 'lose') => {
    setBigFeedback({ text, type });
    setTimeout(() => setBigFeedback(null), 2000);
  };

  function submitPlayer() {
    if (gameOver || cpuThinking) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const canonicalId = resolveAlias(trimmed);
    const country = canonicalId ? getCountryById(canonicalId) : null;

    if (!country) {
      setStatus({ text: "❌ Unknown country! Try again.", type: "error" });
      setStreak(0);
      playSound('wrong');
      showBigFeedback("WRONG!", 'wrong');
      return;
    }
    if (usedIds.has(country.id)) {
      setStatus({ text: "❌ Already used! Try again.", type: "error" });
      setStreak(0);
      playSound('wrong');
      showBigFeedback("ALREADY USED!", 'wrong');
      return;
    }
    
    const first = canonicalize(country.displayName).charAt(0);
    if (first !== requiredLetter) {
      setStatus({ text: `❌ Must start with '${requiredLetter.toUpperCase()}'!`, type: "error" });
      setStreak(0);
      playSound('wrong');
      showBigFeedback("WRONG LETTER!", 'wrong');
      return;
    }

    // Accept player move
    playSound('correct');
    showBigFeedback("CORRECT!", 'correct');
    setStatus({ text: "CPU is thinking...", type: "info" });
    setStreak(s => s + 1);
    setLastPlayerMove(country);
    const nextLetter = lastLetterOfCountry(country);
    const nextUsed = new Set(usedIds).add(country.id);
    
    setHistory((h) => [...h, { by: "you", country, status: 'ok' }]);
    setInput("");
    setCpuThinking(true);

    if (!nextLetter) {
      setTimeout(() => {
        setGameOver(true);
        showBigFeedback("YOU WIN!", 'win');
        setStatus({ text: "You win by glitch! 🎉", type: "success" });
        setCpuThinking(false);
      }, 800);
      return;
    }

    // CPU thinks for a moment
    setTimeout(() => {
      const cpu = pickComputerMove(nextLetter, nextUsed);
      if (!cpu) {
        setRequiredLetter(nextLetter);
        setGameOver(true);
        showBigFeedback("YOU WIN!", 'win');
        setStatus({ text: "I can't think of any. You win! 🏆", type: "success" });
        setCpuThinking(false);
        return;
      }

      const cpuNext = lastLetterOfCountry(cpu);
      nextUsed.add(cpu.id);
      setLastCpuMove(cpu);
      setHistory((h) => [...h, { by: "cpu", country: cpu, status: 'ok' }]);

      if (!cpuNext) {
        setGameOver(true);
        showBigFeedback("YOU WIN!", 'win');
        setStatus({ text: "Glitch on my side. You win! 🏆", type: "success" });
        setCpuThinking(false);
        return;
      }

      setUsedIds(nextUsed);
      setRequiredLetter(cpuNext);
      setStatus({ text: "Your turn!", type: "info" });
      setCpuThinking(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }, 1200);
  }

  function handleSkip() {
    if (gameOver || skipsLeft <= 0 || cpuThinking) {
      if (skipsLeft <= 0) {
        setGameOver(true);
        showBigFeedback("GAME OVER", 'lose');
        setStatus({ text: "No skips left!", type: "error" });
      }
      return;
    }
    setSkipsLeft(s => s - 1);
    const newLetter = getRandomAvailableLetter();
    setRequiredLetter(newLetter);
    setStatus({ text: `Skipped! New letter is '${newLetter.toUpperCase()}'.`, type: "info"});
  }

  function handleGiveUp() {
    if (gameOver || cpuThinking) return;
    setGameOver(true);
    showBigFeedback("GAME OVER", 'lose');
    setStatus({ text: "You gave up! Better luck next time.", type: "error" });
    playSound('wrong');
  }

  if (!gameMode) {
    return (
      <div className="retro-game-root">
        <MusicPlayer />
        <GameModeDialog onSelectMode={startGame} />
      </div>
    );
  }

  return (
    <div className="retro-game-root">
      <MusicPlayer />
      <audio ref={correctSoundRef} src="https://www.orangefreesounds.com/wp-content/uploads/2017/09/Ding-sfx.mp3" preload="auto" />
      <audio ref={wrongSoundRef} src="https://www.orangefreesounds.com/wp-content/uploads/2014/08/Wrong-answer-sound-effect.mp3" preload="auto" />

      {bigFeedback && (
        <div className={`big-feedback ${bigFeedback.type}`}>
          {bigFeedback.text}
        </div>
      )}

      <header className="retro-game-header">
        <h1 className="game-title blink">🌍 Atlas Challenge!</h1>
        <div className="retro-marquee">
          <div className="marquee-inner">Type a country name, don&apos;t repeat, and race against the clock!</div>
        </div>
      </header>

      <main className="game-window">
        <div className="game-panel-left">
          <div className="battle-display">
            <div className="player-side">
              <div className={`avatar ${!cpuThinking && !gameOver ? 'blink' : ''}`}>👤</div>
              <div className="move-display">
                {lastPlayerMove ? (
                  <>
                    <div className="move-label">YOU ➡️</div>
                    <div className="move-country">{lastPlayerMove.displayName}</div>
                  </>
                ) : (
                  <div className="move-placeholder">Your move...</div>
                )}
              </div>
            </div>
            
            <div className="vs-divider">VS</div>
            
            <div className="cpu-side">
              <div className={`avatar cpu-avatar ${cpuThinking ? 'blink' : ''}`}>🤖</div>
              <div className="move-display">
                {cpuThinking ? (
                  <div className="thinking">...thinking...</div>
                ) : lastCpuMove ? (
                  <>
                    <div className="move-label">CPU ➡️</div>
                    <div className="move-country">{lastCpuMove.displayName}</div>
                  </>
                ) : (
                  <div className="move-placeholder">CPU move...</div>
                )}
              </div>
            </div>
          </div>

          <div className="input-box">
            <div className="panel-header">Required Letter: {requiredLetter.toUpperCase()}</div>
            <input
              ref={inputRef}
              className="retro-input"
              type="text"
              value={input}
              placeholder="Type a country..."
              onChange={(e) => handlePlayerInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitPlayer(); }}
              disabled={gameOver || cpuThinking}
              autoFocus
            />
            <div className="button-row">
              <button className="retro-button" onClick={submitPlayer} disabled={gameOver || cpuThinking}>
                Enter ➡️
              </button>
              <button className="retro-button skip" onClick={handleSkip} disabled={gameOver || skipsLeft <= 0 || cpuThinking}>
                Skip ({skipsLeft})
              </button>
              <button className="retro-button give-up" onClick={handleGiveUp} disabled={gameOver || cpuThinking}>
                Give Up 🏳️
              </button>
            </div>
          </div>
          
          <div className={`feedback-message ${status.type} ${status.type === 'warning' ? 'marquee-inner' : ''}`}>
            {status.text}
          </div>
           {gameOver && (
            <div className="game-over-box">
              <div className="game-over-text rainbow-text">GAME OVER</div>
              <button className="retro-button" onClick={() => setGameMode(null)}>
                Play Again [RESET]
              </button>
            </div>
          )}
        </div>

        <div className="game-panel-right">
          <div className="stats-box">
            <div className="panel-header">Stats</div>
            <div className="digital-display">
              {gameMode !== 'endless' && (
                <div className="stat">
                  <div className="stat-label">TIME</div>
                  <div className={`stat-value ${timeLeft <= 10 ? 'danger' : ''}`}>{String(timeLeft).padStart(3, '0')}</div>
                </div>
              )}
              <div className="stat">
                <div className="stat-label">STREAK</div>
                <div className="stat-value">{String(streak).padStart(3, '0')}</div>
              </div>
            </div>
          </div>
          
          <div className="terminal-log">
            <div className="panel-header">Terminal Log</div>
            <div className="terminal-screen">
              <div className="terminal-header">&gt; ATLAS_GAME.EXE</div>
              {history.length === 0 && <div className="terminal-line">&gt; Waiting for input...</div>}
              {history.map((h, i) => (
                <div key={i} className="terminal-line typing">
                  &gt; {h.by === 'you' ? 'YOU' : 'CPU'}: {h.country.displayName} {h.status === 'ok' ? '✔' : '❌'}
                </div>
              ))}
              {history.length > 0 && <div className="terminal-cursor">_</div>}
            </div>
          </div>
        </div>
      </main>

      <footer className="retro-game-footer">
          <p className="webring-links">
            [ <Link href="/">Back to Home</Link> ] 
          </p>
      </footer>
    </div>
  );
} 