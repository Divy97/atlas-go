"use client";

import { useEffect, useState } from "react";
import "./home.css";
import Image from "next/image";
import Link from "next/link";

function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    try {
      const key = "atlas-go-hit-counter";
      const current = Number(localStorage.getItem(key) || "0");
      const next = current + 1;
      localStorage.setItem(key, String(next));
      setCount(next);
    } catch {}
  }, []);
  return (
    <span className="hit-counter">{String(count ?? 1).padStart(6, "0")}</span>
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
          <div className="loading-box">
            <div className="loading-spinner">⚡</div>
            LOADING AWESOME GAMES... PLEASE WAIT ⏳
          </div>
        </div>
      )}

      <section className="home-hero">
        <div className="hero-inner">
          <div className="hero-badge">🎮 ULTIMATE GEOGRAPHY GAMES 🎮</div>
          
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
          
          <p className="hero-sub blink">*** ✨ TEST YOUR GEOGRAPHY SKILLS! ✨ ***</p>
          <p className="hero-description">Challenge yourself with countries and cities from around the world!</p>
          
          <div className="hero-ctas">
            <Link className="cta primary mega-cta" href="/atlas">
              🚀 START PLAYING NOW! 🚀
            </Link>
            <Link className="cta secondary" href="#games">
              📋 Browse All Games
            </Link>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">200+</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-item">
              <span className="stat-number">150K+</span>
              <span className="stat-label">Cities</span>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-item">
              <span className="stat-number">∞</span>
              <span className="stat-label">Fun</span>
            </div>
          </div>
        </div>
      </section>

      <div className="retro-marquee" role="marquee" aria-label="announcements">
        <div className="marquee-inner">
          🔥 WELCOME TO THE ULTIMATE GEOGRAPHY CHALLENGE 🔥 PLAY ATLAS NOW 🔥 NEW CITIES MODE AVAILABLE 🔥 TEST YOUR KNOWLEDGE 🔥
        </div>
      </div>

      <nav className="retro-nav" aria-label="primary">
        <Link className="nav-btn" href="/atlas">
          <Image
            height={16}
            width={20}
            className="arrow-gif"
            alt="arrow"
            src="https://web.archive.org/web/20090830131028im_/http://geocities.com/SunsetStrip/Amphitheatre/8793/aniarrow.gif"
            style={{ height: "auto" }}
          />
          Countries Atlas
        </Link>
        <Link className="nav-btn" href="/cities-atlas">
          <Image
            height={16}
            width={20}
            className="arrow-gif"
            alt="arrow"
            src="https://web.archive.org/web/20090830131028im_/http://geocities.com/SunsetStrip/Amphitheatre/8793/aniarrow.gif"
            style={{ height: "auto" }}
          />
          Cities Atlas
        </Link>
        {/* <a className="nav-btn" href="#about">
          <Image
            height={30}
            width={30}
            className="arrow-gif"
            alt="arrow"
            src="https://web.archive.org/web/20090830131028im_/http://geocities.com/SunsetStrip/Amphitheatre/8793/aniarrow.gif"
            style={{ height: "auto" }}
          />
          <span className="code">About</span>
        </a>
        <a className="nav-btn soon" href="#flags">
          <Image
            height={16}
            width={20}
            className="arrow-gif"
            alt="arrow"
            src="https://web.archive.org/web/20090830131028im_/http://geocities.com/SunsetStrip/Amphitheatre/8793/aniarrow.gif"
            style={{ height: "auto" }}
          />
          Guess the Flag
        </a> */}
      </nav>

      <main id="games" className="home-games-section">
        <div className="games-header">
          <h2 className="games-title">🎯 CHOOSE YOUR CHALLENGE 🎯</h2>
          <p className="games-subtitle">Pick a game mode and start your geography adventure!</p>
        </div>

        <div className="home-games-grid">
          <div className="game-card accent-blue double featured">
            <div className="game-card-header">
              <div className="popularity-badge">🔥 MOST POPULAR</div>
            </div>
            <div className="game-card-body">
              <h3 className="game-card-title">🌍 Atlas (Countries)</h3>
              <p className="game-card-desc">
                Name countries until your brain MELTS! Start with any country and keep the chain going. Perfect for geography enthusiasts! 🧠💥
              </p>
              <div className="game-features">
                <span className="feature-tag">✅ 200+ Countries</span>
                <span className="feature-tag">⏱️ Timed Mode</span>
                <span className="feature-tag">🏆 High Scores</span>
              </div>
            </div>
            <div className="game-card-actions">
              <Link className="home-cta primary-cta" href="/atlas">
                🚀 PLAY NOW - IT&apos;S FREE!
              </Link>
            </div>
          </div>

          <div className="game-card accent-green dotted new-game">
            <div className="game-card-header">
              <div className="new-badge">
                <Image
                  height={30}
                  width={50}
                  className="new-gif"
                  alt="new"
                  src="https://web.archive.org/web/20090830160525im_/http://geocities.com/CapitolHill/Parliament/1048/new.gif"
                  style={{ height: "auto" }}
                />
              </div>
            </div>
            <div className="game-card-body">
              <h3 className="game-card-title">🏙️ Atlas (Cities)</h3>
              <p className="game-card-desc">
                Cities mode with 150k+ cities worldwide! From Tokyo to Timbuktu - can you handle the ultimate urban challenge? 🏙️
              </p>
              <div className="game-features">
                <span className="feature-tag">✅ 150K+ Cities</span>
                <span className="feature-tag">🌟 Brand New</span>
                <span className="feature-tag">🗺️ Global Coverage</span>
              </div>
            </div>
            <div className="game-card-actions">
              <Link className="home-cta secondary-cta" href="/cities-atlas">
                🎯 TRY THE NEW MODE!
              </Link>
            </div>
          </div>

          <div id="flags" className="game-card accent-orange dashed soon coming-soon">
            <div className="game-card-header">
              <div className="coming-soon-badge">🚧 COMING SOON</div>
            </div>
            <div className="game-card-body">
              <h3 className="game-card-title">🏁 Guess the Flag</h3>
              <p className="game-card-desc">
                Test your flag knowledge! Can you identify countries by their flags? This awesome mode is in development! 🏁
              </p>
              <div className="game-features">
                <span className="feature-tag disabled">🏁 Flag Quiz</span>
                <span className="feature-tag disabled">⚡ Quick Rounds</span>
                <span className="feature-tag disabled">🔄 Coming Soon</span>
              </div>
            </div>
            <div className="game-card-actions">
              <button className="home-cta disabled" disabled>
                🔒 UNDER CONSTRUCTION
              </button>
            </div>
          </div>
        </div>

        <div className="quick-start-section">
          <div className="quick-start-box">
            <h3>⚡ QUICK START GUIDE ⚡</h3>
            <div className="quick-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span className="step-text">Choose a game mode above</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span className="step-text">Start typing country/city names</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span className="step-text">Keep the chain going as long as possible!</span>
              </div>
            </div>
            <p className="quick-tip">💡 <strong>Pro Tip:</strong> The last letter of your answer becomes the first letter of the next!</p>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <div className="footer-row">
          <span>© 2025 Atlas Go - The Ultimate Geography Game</span>
          <span>•</span>
          <span>Visitors: <VisitorCounter /></span>
          <span>•</span>
          <span>
            <Image
              height={18}
              width={20}
              className="envelope"
              alt="email"
              src="https://web.archive.org/web/20090830160525im_/http://geocities.com/CapitolHill/Parliament/1048/envelope.gif"
              style={{ height: "auto" }}
            />
            Made with ❤️ for geography lovers
          </span>
        </div>
        <div className="footer-row small">
          <span>🌍 Test your geography knowledge • 🏆 Challenge your friends • 🎮 Free to play forever</span>
        </div>
      </footer>
    </div>
  );
}
