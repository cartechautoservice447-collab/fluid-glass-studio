import { useEffect, useState } from "react";

/**
 * Standalone Digital Notebook entrance experience.
 *
 * This is intentionally self-contained. The existing website remains behind
 * this layer and is revealed automatically after activation. No existing
 * workspace feature is changed here.
 */
export function DigitalNotebookWelcome() {
  const [introDone, setIntroDone] = useState(false);
  const [activated, setActivated] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroDone(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activated) return;
    const welcomeTimer = window.setTimeout(() => setLeaving(true), 2300);
    return () => window.clearTimeout(welcomeTimer);
  }, [activated]);

  if (leaving) return null;

  return (
    <div className={`dnw-root${leaving ? " dnw-leaving" : ""}`} aria-label="Digital Notebook introduction">
      <style>{`
        .dnw-root {
          position: fixed;
          inset: 0;
          z-index: 99999;
          width: 100vw;
          height: 100dvh;
          min-height: 100vh;
          overflow: hidden;
          display: grid;
          place-items: center;
          isolation: isolate;
          background: #090a0d;
          color: #f7f8fa;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          animation: dnw-root-in .45s ease-out both;
        }

        .dnw-root::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 45%, rgba(155,165,180,.14), transparent 34%),
            radial-gradient(circle at 50% 100%, rgba(35,48,62,.2), transparent 48%),
            linear-gradient(180deg, #0a0b0e 0%, #08090c 100%);
          z-index: -3;
        }

        .dnw-stars {
          position: absolute;
          inset: 0;
          opacity: 0;
          background-image:
            radial-gradient(circle at 12% 20%, rgba(255,255,255,.55) 0 1px, transparent 1.5px),
            radial-gradient(circle at 72% 13%, rgba(255,255,255,.42) 0 1px, transparent 1.5px),
            radial-gradient(circle at 84% 70%, rgba(255,255,255,.52) 0 1px, transparent 1.5px),
            radial-gradient(circle at 20% 76%, rgba(255,255,255,.35) 0 1px, transparent 1.5px),
            radial-gradient(circle at 55% 84%, rgba(255,255,255,.3) 0 1px, transparent 1.5px);
          animation: dnw-stars-in .8s ease 3.9s forwards;
        }

        /* Cinematic animation reconstructed from the supplied reference video. */
        .dnw-cinema {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          opacity: 1;
          animation: dnw-cinema-out .75s cubic-bezier(.22,1,.36,1) 5.35s forwards;
        }

        .dnw-scene {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
        }

        .dnw-scene-one { animation: dnw-scene-one 2.15s ease-in-out forwards; }
        .dnw-scene-two { opacity: 0; animation: dnw-scene-two 2.15s ease-in-out 1.85s forwards; }
        .dnw-scene-three { opacity: 0; animation: dnw-scene-three 2.15s ease-in-out 3.7s forwards; }

        .dnw-coding-layout {
          width: min(78vw, 860px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(24px, 4vw, 56px);
          transform: translateY(2px);
        }

        .dnw-laptop {
          position: relative;
          width: clamp(250px, 34vw, 440px);
          aspect-ratio: 1.55;
          flex: 0 0 auto;
          filter: drop-shadow(0 24px 38px rgba(0,0,0,.5));
        }

        .dnw-screen {
          position: absolute;
          left: 8%;
          top: 0;
          width: 84%;
          height: 87%;
          border: clamp(5px, .55vw, 8px) solid #c8cbd0;
          border-bottom-width: clamp(7px, .8vw, 11px);
          border-radius: 12px 12px 5px 5px;
          background: #d9dadd;
          box-shadow: inset 0 0 25px rgba(0,0,0,.12), 0 0 48px rgba(210,220,235,.13);
          overflow: hidden;
        }

        .dnw-screen::before {
          content: "";
          position: absolute;
          left: 7%;
          right: 7%;
          top: 7%;
          bottom: 7%;
          border-radius: 2px;
          background: #d0d0d2;
        }

        .dnw-screen-dot {
          position: absolute;
          top: 3px;
          left: 50%;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #777b80;
          transform: translateX(-50%);
        }

        .dnw-code {
          position: absolute;
          left: 14%;
          top: 14%;
          z-index: 2;
          white-space: pre;
          font: 600 clamp(7px, .72vw, 11px)/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          color: #282b30;
          text-align: left;
        }

        .dnw-code .pink { color: #a83b6f; }
        .dnw-code .gold { color: #916f28; }
        .dnw-code .green { color: #456f48; }

        .dnw-base {
          position: absolute;
          left: 1%;
          bottom: 5%;
          width: 98%;
          height: 8%;
          border-radius: 0 0 50% 50%;
          background: linear-gradient(180deg, #666a70, #26292d);
          box-shadow: 0 10px 16px rgba(0,0,0,.5);
        }

        .dnw-base::after {
          content: "";
          position: absolute;
          left: 42%;
          top: 0;
          width: 16%;
          height: 38%;
          border-radius: 0 0 5px 5px;
          background: #777b80;
        }

        .dnw-word {
          margin: 0;
          font-size: clamp(42px, 6.4vw, 88px);
          line-height: .95;
          font-weight: 600;
          letter-spacing: -.065em;
          color: #f3f3f4;
          text-shadow: 0 0 32px rgba(255,255,255,.1);
        }

        .dnw-cursor {
          position: absolute;
          width: clamp(34px, 4vw, 56px);
          aspect-ratio: .78;
          background: #f4f5f7;
          clip-path: polygon(0 0, 100% 67%, 61% 69%, 81% 100%, 67% 100%, 47% 73%, 20% 93%);
          filter: drop-shadow(0 8px 10px rgba(0,0,0,.45));
          left: 48%;
          top: 47%;
          opacity: 0;
          transform: translate(-50%, -50%) scale(.8);
          animation: dnw-cursor 1.3s cubic-bezier(.22,1,.36,1) 1.05s forwards;
        }

        .dnw-editor {
          width: min(72vw, 900px);
          height: min(55vh, 510px);
          border: 1px solid rgba(255,255,255,.24);
          border-radius: 14px;
          background: rgba(17,20,25,.92);
          box-shadow: 0 35px 100px rgba(0,0,0,.58), 0 0 70px rgba(170,185,205,.09);
          overflow: hidden;
          transform: scale(.92) translateY(28px);
          animation: dnw-editor 1.35s cubic-bezier(.16,1,.3,1) 3.75s forwards;
        }

        .dnw-editor-bar {
          height: 42px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 14px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.035);
        }

        .dnw-dot { width: 9px; height: 9px; border-radius: 50%; background: #e4e5e7; opacity: .8; }
        .dnw-editor-title { margin-left: 12px; font: 500 11px ui-monospace, monospace; color: rgba(255,255,255,.48); }

        .dnw-editor-body {
          display: grid;
          grid-template-columns: 48px 1fr;
          height: calc(100% - 42px);
          padding-top: 18px;
          font: 500 clamp(9px, .9vw, 13px)/1.72 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }

        .dnw-lines { padding: 0 12px; text-align: right; color: rgba(255,255,255,.2); user-select: none; }
        .dnw-editor-code { padding-left: 14px; color: #c9d1d9; text-align: left; overflow: hidden; }
        .dnw-editor-code .kw { color: #ff7b72; }
        .dnw-editor-code .fn { color: #d2a8ff; }
        .dnw-editor-code .str { color: #a5d6ff; }
        .dnw-editor-code .num { color: #79c0ff; }
        .dnw-editor-code .cm { color: #8b949e; }

        .dnw-interface {
          position: relative;
          z-index: 10;
          width: min(92vw, 960px);
          display: grid;
          justify-items: center;
          text-align: center;
          padding: clamp(24px, 5vw, 64px);
          opacity: 0;
          transform: translateY(18px) scale(.985);
          animation: dnw-interface-in .95s cubic-bezier(.22,1,.36,1) 6s forwards;
        }

        .dnw-interface.hidden { display: none; }
        .dnw-kicker { margin-bottom: 20px; font-size: clamp(9px, .7vw, 11px); font-weight: 700; letter-spacing: .42em; text-transform: uppercase; color: rgba(255,255,255,.4); }
        .dnw-title { margin: 0; font-size: clamp(42px, 6vw, 84px); font-weight: 600; line-height: .98; letter-spacing: -.06em; color: #f5f6f8; text-shadow: 0 15px 45px rgba(255,255,255,.09); }
        .dnw-subtitle { max-width: 560px; margin: 22px auto 34px; font-size: clamp(13px, 1.25vw, 17px); line-height: 1.7; color: rgba(255,255,255,.46); }

        .dnw-activate {
          position: relative;
          min-width: clamp(154px, 18vw, 205px);
          height: 54px;
          padding: 0 28px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          cursor: pointer;
          color: rgba(255,255,255,.92);
          background: rgba(255,255,255,.055);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.1), 0 18px 50px rgba(0,0,0,.32);
          backdrop-filter: blur(18px) saturate(120%);
          -webkit-backdrop-filter: blur(18px) saturate(120%);
          transition: transform .35s cubic-bezier(.22,1,.36,1), border-color .35s, box-shadow .35s, background .35s;
        }
        .dnw-activate:hover { transform: translateY(-2px); border-color: rgba(255,255,255,.3); }
        .dnw-activate:active { transform: scale(.98); }
        .dnw-activate.active { border-color: rgba(70,255,137,.6); background: rgba(31,91,54,.18); color: #dcffe7; box-shadow: inset 0 1px 0 rgba(170,255,196,.18), 0 0 0 1px rgba(57,255,125,.08), 0 0 38px rgba(55,255,126,.28), 0 18px 55px rgba(0,0,0,.32); }
        .dnw-button-content { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 10px; }
        .dnw-status { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.34); transition: background .35s, box-shadow .35s; }
        .dnw-activate.active .dnw-status { background: #54ff8b; box-shadow: 0 0 8px #54ff8b, 0 0 18px rgba(84,255,139,.75); animation: dnw-status-pulse 1.2s ease-in-out infinite; }

        .dnw-welcome { margin-top: 34px; opacity: 0; transform: translateY(13px) scale(.98); }
        .dnw-welcome.visible { animation: dnw-welcome-in .9s cubic-bezier(.22,1,.36,1) forwards; }
        .dnw-welcome-text { margin: 0; font-size: clamp(21px, 3vw, 43px); font-weight: 500; letter-spacing: -.035em; color: rgba(255,255,255,.94); }
        .dnw-welcome-text::after { content: ""; display: block; width: 36px; height: 1px; margin: 18px auto 0; background: linear-gradient(90deg, transparent, rgba(84,255,139,.8), transparent); }

        @keyframes dnw-root-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dnw-scene-one { 0% { opacity: 0; transform: scale(.9); } 16% { opacity: 1; transform: scale(1); } 76% { opacity: 1; } 100% { opacity: 0; transform: scale(1.03); } }
        @keyframes dnw-scene-two { 0% { opacity: 0; transform: scale(.96); } 15% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; transform: scale(1.03); } }
        @keyframes dnw-scene-three { 0% { opacity: 0; transform: scale(.97); } 15% { opacity: 1; transform: scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: scale(1.015); } }
        @keyframes dnw-cursor { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.8); } 25% { opacity: 1; } 55% { opacity: 1; transform: translate(28px,-8px) scale(1); } 100% { opacity: 0; transform: translate(54px,18px) scale(.94); } }
        @keyframes dnw-editor { to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes dnw-cinema-out { to { opacity: 0; visibility: hidden; } }
        @keyframes dnw-interface-in { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes dnw-welcome-in { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes dnw-status-pulse { 0%,100% { transform: scale(.85); } 50% { transform: scale(1.15); } }
        @keyframes dnw-stars-in { to { opacity: .7; } }

        @media (max-width: 720px) {
          .dnw-coding-layout { width: 90vw; gap: 18px; }
          .dnw-word { font-size: clamp(30px, 9vw, 56px); }
          .dnw-laptop { width: 48vw; }
          .dnw-editor { width: 90vw; height: 44vh; }
          .dnw-editor-body { grid-template-columns: 34px 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dnw-cinema, .dnw-scene, .dnw-cursor, .dnw-editor, .dnw-interface, .dnw-stars { animation: none !important; }
          .dnw-cinema { display: none; }
          .dnw-interface { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="dnw-stars" aria-hidden="true" />

      {!introDone && (
        <div className="dnw-cinema" aria-hidden="true">
          <div className="dnw-scene dnw-scene-one">
            <div className="dnw-coding-layout">
              <div className="dnw-laptop">
                <div className="dnw-screen">
                  <span className="dnw-screen-dot" />
                  <div className="dnw-code">
                    <span>&lt;?php</span>{"\n"}
                    <span className="pink">function</span> show_love() {"{"}{"\n"}
                    {"  "}echo <span className="gold">"LOVE"</span>;{"\n"}
                    {"}"}{"\n"}
                    <span>?&gt;</span>
                  </div>
                </div>
                <div className="dnw-base" />
              </div>
              <h2 className="dnw-word">CODING</h2>
            </div>
          </div>

          <div className="dnw-scene dnw-scene-two">
            <div className="dnw-coding-layout">
              <div className="dnw-laptop">
                <div className="dnw-screen">
                  <span className="dnw-screen-dot" />
                  <div className="dnw-code">
                    <span className="pink">function</span> start() {"{"}{"\n"}
                    {"  "}<span className="green">return</span> <span className="gold">"welcome"</span>;{"\n"}
                    {"}"}{"\n"}
                    <span className="pink">if</span> (ready) open();
                  </div>
                </div>
                <div className="dnw-base" />
              </div>
              <h2 className="dnw-word">CODING</h2>
              <span className="dnw-cursor" />
            </div>
          </div>

          <div className="dnw-scene dnw-scene-three">
            <div className="dnw-editor">
              <div className="dnw-editor-bar">
                <span className="dnw-dot" /><span className="dnw-dot" /><span className="dnw-dot" />
                <span className="dnw-editor-title">digital-notebook.tsx</span>
              </div>
              <div className="dnw-editor-body">
                <div className="dnw-lines">{Array.from({ length: 18 }, (_, i) => <div key={i}>{i + 1}</div>)}</div>
                <div className="dnw-editor-code">
                  <div><span className="kw">const</span> notebook = <span className="fn">createNotebook</span>();</div>
                  <div><span className="kw">function</span> <span className="fn">write</span>(note) {"{"}</div>
                  <div>  <span className="kw">return</span> notebook.<span className="fn">save</span>(note);</div>
                  <div>{"}"}</div>
                  <br />
                  <div><span className="kw">const</span> preview = <span className="fn">render</span>({"{"}</div>
                  <div>  theme: <span className="str">"premium-dark"</span>,</div>
                  <div>  output: <span className="str">"terminal"</span>,</div>
                  <div>  focus: <span className="kw">true</span>,</div>
                  <div>{"}"});</div>
                  <br />
                  <div className="cm">// everything in one focused workspace</div>
                  <div><span className="kw">export default</span> notebook;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {introDone && (
        <main className="dnw-interface" aria-label="Digital Notebook activation">
          <div className="dnw-kicker">A quieter place to think</div>
          <h1 className="dnw-title">Digital Notebook</h1>
          <p className="dnw-subtitle">Your ideas, notes and code — brought together in one focused workspace.</p>

          <button
            type="button"
            className={`dnw-activate${activated ? " active" : ""}`}
            aria-pressed={activated}
            onClick={() => setActivated(true)}
          >
            <span className="dnw-button-content">
              <span className="dnw-status" aria-hidden="true" />
              {activated ? "Activated" : "Activate"}
            </span>
          </button>

          <div className={`dnw-welcome${activated ? " visible" : ""}`} aria-live="polite">
            <p className="dnw-welcome-text">Welcome to Digital Notebook</p>
          </div>
        </main>
      )}
    </div>
  );
}

export default DigitalNotebookWelcome;
