"use client";

import { useEffect, useRef, useState } from "react";
import "./home.css";
import Image from "next/image";

function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchVisitorCount = async () => {
      try {
        // Set a longer timeout (3 minutes) to wait for the API response
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000); // 3 minutes
        
        const response = await fetch('https://atlas-go-1.onrender.com/visit', {
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch visitor count: ${response.status}`);
        }
        
        const data = await response.json();
        setCount(data.count);
      } catch (error) {
        console.error('Error fetching visitor count:', error);
        // Don't set any count, will show "??????" due to null count
      } finally {
        setLoading(false);
      }
    };
    
    fetchVisitorCount();
  }, []);
  
  return (
    <span className="hit-counter">
      {loading ? "002000" : count ? String(count).padStart(6, "0") : "??????"}
    </span>
  );
}

function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleFirstInteraction = () => {
      // This logic should only run once. After the first interaction, we remove the listeners.
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);

      // Try to play, and update state if successful.
      audio.play()
        .then(() => setPlaying(true))
        .catch(err => console.warn("Autoplay after interaction failed:", err));
    };

    // Attempt to autoplay when the component mounts.
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => {
        // If autoplay is blocked, set up listeners for the first user interaction.
        setPlaying(false);
        window.addEventListener('click', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);
      });
    
    // Cleanup listeners when the component unmounts.
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
      audio.play()
        .then(() => setPlaying(true))
        .catch(e => console.error("Audio play failed on click:", e));
    }
  };

  return (
    <div className="music-player-container">
      <audio ref={audioRef} src="https://soundimage.org/wp-content/uploads/2019/01/The-Pixeltown-Shuffle.mp3" loop preload="auto" />
      <button onClick={togglePlay} className="music-toggle-btn" title="Toggle Background Music">
        <span className="blink">🎵</span> {playing ? "Mute" : "Play"} Music
      </button>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="home-retro-root">
      {loading && (
        <div className="loading-overlay" aria-live="polite">
          <div className="loading-box">LOADING… PLEASE WAIT ⏳</div>
        </div>
      )}

      <MusicPlayer />

      <section className="home-hero">
        <div className="hero-inner">
          <h1 className="hero-title rainbow-text wordart-outline">
            <Image
              width={100}
              height={200}
              className="globe-gif"
              alt="Spinning globe"
              src="https://www.animatedimages.org/data/media/1667/animated-world-globe-image-0040.gif"
              style={{ height: "auto" }}
            />
            &nbsp;ATLAS GO&nbsp;
            <Image
              width={100}
              height={200}
              className="globe-gif"
              alt="Spinning globe"
              src="https://www.animatedimages.org/data/media/1667/animated-world-globe-image-0040.gif"
              style={{ height: "auto" }}
            />
          </h1>
          <p className="hero-sub blink">*** ✨ WELCOME TO Atlas Go!!! ✨ ***</p>
          <div className="hero-ctas">
            <a className="cta primary" href="/atlas">
              Play Atlas
            </a>
            <a className="cta secondary" href="#games">
              Explore Games
            </a>
          </div>
        </div>
      </section>

      <div className="retro-marquee" role="marquee" aria-label="announcements">
        <div className="marquee-inner">
          🔥 WELCOME 🔥 tO ThE UlTiMaTe GaMe 🔥 PlAy aTlAs nOw 🔥 NeW MoDeS SooN
          🔥
        </div>
      </div>

      <nav className="retro-nav" aria-label="primary">
        <a id="code-3AE" className="nav-btn" href="/atlas">
          <Image
            height={30}
            width={30}
            className="arrow-gif"
            alt="arrow"
            src="https://web.archive.org/web/20090830131028im_/http://geocities.com/SunsetStrip/Amphitheatre/8793/aniarrow.gif"
            style={{ height: "auto" }}
          />
          Play Atlas
        </a>
        <a id="code-6A9" className="nav-btn" href="#flags">
          <Image
            height={30}
            width={30}
            className="arrow-gif"
            alt="arrow"
            src="https://web.archive.org/web/20090830131028im_/http://geocities.com/SunsetStrip/Amphitheatre/8793/aniarrow.gif"
            style={{ height: "auto" }}
          />
          Guess the Flag
        </a>
      </nav>

      <main id="games" className="home-games-grid">
        <div className="game-card accent-blue double">
          <div className="game-card-body">
            <h2 className="game-card-title">Atlas (Countries)</h2>
            <p className="game-card-desc">
              Name countries until your brain MELTS 🧠💥
            </p>
          </div>
          <div className="game-card-actions">
            <a className="home-cta" href="/atlas">
              CLICK HERE TO PLAY!
            </a>
          </div>
        </div>

        <div className="game-card accent-green dotted soon">
          <div className="game-card-body">
            <h2 className="game-card-title">Atlas (Cities)
            <Image
                height={30}
                width={50}
                className="new-gif"
                alt="new"
                src="https://web.archive.org/web/20090830160525im_/http://geocities.com/CapitolHill/Parliament/1048/new.gif"
                style={{ height: "auto" }}
              />
            </h2>
            <p className="game-card-desc">
              Cities mode… bigger brain burn. SOON!!! 🏙️
            </p>
          </div>
          <div className="game-card-actions">
            <button className="home-cta disabled" disabled>
              Coming Soon
            </button>
          </div>
        </div>

        <div id="flags" className="game-card accent-pink dashed soon">
          <div className="game-card-body">
            <h2 className="game-card-title">
              Guess the Flag
              <Image
                height={30}
                width={50}
                className="new-gif"
                alt="new"
                src="https://web.archive.org/web/20090830160525im_/http://geocities.com/CapitolHill/Parliament/1048/new.gif"
                style={{ height: "auto" }}
              />
            </h2>
            <p className="game-card-desc">
              Flags = FUN. Coming Soon. Don’t miss it!!! 🚩🔥
            </p>
          </div>
          <div className="game-card-actions">
            <button className="home-cta disabled" disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </main>

      <section className="awards">
        <Image
          height={200}
          width={100}
          className="dance"
          alt="dancer"
          src="https://blob.gifcities.org/gifcities/2JTU7QIVICQHJGTS7X2XATX7VLAK7MNN.gif"
          style={{ height: "auto" }}
        />
      </section>

      <footer className="home-footer">
        <p className="blink">
          You are visitor number: <VisitorCounter /> since 1998
        </p>
        <p>
          Contact:{" "}
          <a href="mailto:divyparekh1810@gmail.com">divyparekh1810@gmail.com</a>{" "}
          | Github: <a href="https://github.com/Divy97">@Divy97</a>
        </p>
        <p className="small">
          Last updated: August 16, 1998 | © {new Date().getFullYear()} Atlas Go
        </p>
      </footer>
    </div>
  );
}
