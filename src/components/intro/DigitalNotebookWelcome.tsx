import { useEffect, useState } from "react";

/**
 * Standalone premium Digital Notebook welcome/activation interface.
 *
 * This file is intentionally self-contained. It does not modify or depend on
 * any existing workspace component, layout, or feature.
 *
 * Usage when integration is explicitly desired:
 *   <DigitalNotebookWelcome />
 */
export function DigitalNotebookWelcome() {
  const [introFinished, setIntroFinished] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroFinished(true), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="dnw-root">
      <style>{`
        .dnw-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          width: 100vw;
          height: 100dvh;
          min-height: 100vh;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(circle at 50% 46%, rgba(90, 100, 116, .14), transparent 30%),
            radial-gradient(circle at 50% 100%, rgba(27, 40, 53, .20), transparent 48%),
            #080a0d;
          color: #f5f7fa;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .dnw-root::before {
          content: "";
          position: absolute;
          inset: -30%;
          z-index: -2;
          background: radial-gradient(circle, rgba(255,255,255,.065) 0 1px, transparent 1.5px);
          background-size: 48px 48px;
          mask-image: radial-gradient(circle at center, black, transparent 67%);
          opacity: .32;
          animation: dnw-drift 18s linear infinite;
        }

        .dnw-root::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: radial-gradient(circle at center, transparent 0 36%, rgba(0,0,0,.46) 100%);
        }

        .dnw-cinema {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          animation: dnw-cinema-out 1s cubic-bezier(.22,1,.36,1) 2.7s forwards;
        }

        .dnw-cinema-orb {
          width: clamp(150px, 18vw, 300px);
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle at 45% 38%, rgba(255,255,255,.95), rgba(190,200,211,.28) 23%, rgba(100,110,123,.08) 49%, transparent 69%);
          filter: blur(1px);
          box-shadow: 0 0 90px rgba(220,225,232,.18), 0 0 180px rgba(170,180,195,.08);
          animation: dnw-orb 2.8s cubic-bezier(.22,1,.36,1) forwards;
        }

        .dnw-cinema-line {
          position: absolute;
          width: min(34vw, 420px);
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent);
          opacity: 0;
          animation: dnw-line 2.4s ease .35s forwards;
        }

        .dnw-interface {
          position: relative;
          z-index: 2;
          display: grid;
          justify-items: center;
          width: min(92vw, 900px);
          padding: clamp(24px, 5vw, 64px);
          text-align: center;
          opacity: 0;
          transform: translateY(18px) scale(.985);
          animation: dnw-interface-in .9s cubic-bezier(.22,1,.36,1) 3s forwards;
        }

        .dnw-kicker {
          margin-bottom: 20px;
          font-size: clamp(9px, .7vw, 11px);
          font-weight: 700;
          letter-spacing: .42em;
          text-transform: uppercase;
          color: rgba(255,255,255,.42);
        }

        .dnw-title {
          margin: 0;
          max-width: 820px;
          font-size: clamp(34px, 6.2vw, 88px);
          font-weight: 600;
          line-height: .98;
          letter-spacing: -.055em;
          text-wrap: balance;
          background: linear-gradient(180deg, #fff 0%, #e5e8ec 48%, #9da5af 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 14px 45px rgba(255,255,255,.08);
        }

        .dnw-subtitle {
          max-width: 520px;
          margin: 22px auto 34px;
          font-size: clamp(13px, 1.25vw, 17px);
          line-height: 1.7;
          color: rgba(255,255,255,.46);
        }

        .dnw-activate {
          position: relative;
          min-width: clamp(154px, 18vw, 205px);
          height: 52px;
          padding: 0 28px;
          border: 1px solid rgba(255,255,255,.17);
          border-radius: 999px;
          outline: none;
          cursor: pointer;
          overflow: hidden;
          color: rgba(255,255,255,.9);
          background: rgba(255,255,255,.055);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 16px 45px rgba(0,0,0,.30);
          backdrop-filter: blur(18px) saturate(120%);
          -webkit-backdrop-filter: blur(18px) saturate(120%);
          transition: transform .35s cubic-bezier(.22,1,.36,1), border-color .35s, box-shadow .35s, background .35s;
        }

        .dnw-activate:hover { transform: translateY(-2px); border-color: rgba(255,255,255,.3); }
        .dnw-activate:active { transform: translateY(0) scale(.98); }

        .dnw-activate::before {
          content: "";
          position: absolute;
          inset: -70%;
          opacity: 0;
          background: radial-gradient(circle, rgba(74,255,143,.42), transparent 45%);
          transition: opacity .4s;
        }

        .dnw-activate.is-active {
          border-color: rgba(67, 255, 132, .58);
          background: rgba(31, 91, 54, .16);
          color: #d9ffe5;
          box-shadow:
            inset 0 1px 0 rgba(170,255,196,.18),
            0 0 0 1px rgba(57,255,125,.08),
            0 0 34px rgba(55,255,126,.25),
            0 18px 55px rgba(0,0,0,.32);
        }

        .dnw-activate.is-active::before { opacity: 1; animation: dnw-green-pulse 1.8s ease-in-out infinite; }

        .dnw-button-content { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 10px; }
        .dnw-status {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,.34);
          box-shadow: 0 0 0 transparent;
          transition: background .35s, box-shadow .35s;
        }
        .dnw-activate.is-active .dnw-status {
          background: #54ff8b;
          box-shadow: 0 0 8px #54ff8b, 0 0 18px rgba(84,255,139,.75);
          animation: dnw-status-pulse 1.2s ease-in-out infinite;
        }

        .dnw-welcome {
          margin-top: 34px;
          opacity: 0;
          transform: translateY(13px) scale(.98);
          pointer-events: none;
        }
        .dnw-welcome.is-visible {
          animation: dnw-welcome-in .9s cubic-bezier(.22,1,.36,1) forwards;
        }
        .dnw-welcome-text {
          margin: 0;
          font-size: clamp(20px, 3vw, 42px);
          font-weight: 500;
          letter-spacing: -.035em;
          color: rgba(255,255,255,.92);
        }
        .dnw-welcome-text::after {
          content: "";
          display: block;
          width: 34px;
          height: 1px;
          margin: 18px auto 0;
          background: linear-gradient(90deg, transparent, rgba(84,255,139,.8), transparent);
        }

        @keyframes dnw-orb {
          0% { opacity: 0; transform: scale(.25); }
          28% { opacity: 1; transform: scale(1); }
          72% { opacity: .9; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.45); }
        }
        @keyframes dnw-line {
          0% { opacity: 0; transform: scaleX(.1); }
          35% { opacity: .8; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(1.4); }
        }
        @keyframes dnw-cinema-out { 0%,72% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes dnw-interface-in { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes dnw-welcome-in { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes dnw-green-pulse { 0%,100% { transform: scale(.94); opacity: .6; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes dnw-status-pulse { 0%,100% { transform: scale(.85); } 50% { transform: scale(1.15); } }
        @keyframes dnw-drift { to { transform: translate3d(24px, 18px, 0); } }

        @media (prefers-reduced-motion: reduce) {
          .dnw-cinema, .dnw-cinema-orb, .dnw-cinema-line, .dnw-interface, .dnw-welcome, .dnw-root::before { animation: none !important; }
          .dnw-interface { opacity: 1; transform: none; }
          .dnw-cinema { display: none; }
        }
      `}</style>

      <div className="dnw-cinema" aria-hidden="true">
        <div className="dnw-cinema-orb" />
        <div className="dnw-cinema-line" />
      </div>

      {introFinished && (
        <main className="dnw-interface" aria-label="Digital Notebook activation">
          <div className="dnw-kicker">A quieter place to think</div>
          <h1 className="dnw-title">Digital Notebook</h1>
          <p className="dnw-subtitle">
            Your ideas, notes and code — brought together in one focused workspace.
          </p>

          <button
            type="button"
            className={`dnw-activate${activated ? " is-active" : ""}`}
            aria-pressed={activated}
            onClick={() => setActivated(true)}
          >
            <span className="dnw-button-content">
              <span className="dnw-status" aria-hidden="true" />
              {activated ? "Activated" : "Activate"}
            </span>
          </button>

          <div className={`dnw-welcome${activated ? " is-visible" : ""}`} aria-live="polite">
            <p className="dnw-welcome-text">Welcome to Digital Notebook</p>
          </div>
        </main>
      )}
    </div>
  );
}

export default DigitalNotebookWelcome;
