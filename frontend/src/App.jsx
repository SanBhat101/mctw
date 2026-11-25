import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { toEnglish, toMorse } from "./api.js";
import { audioTime, playMorse, startMarch, stopMarch, stopMorse } from "./audio.js";
import Stage from "./components/Stage.jsx";

const TITLE = "Morse Code Translator";
const BURSTS = ["POW!", "BAM!", "ZAP!", "KA-CHUNK!", "BOFF!", "WHAM!"];
const TAPE_LIMIT = 240;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Field({ id, label, placeholder, value, onChange, invalid, mono, children }) {
  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        {children}
      </div>
      <textarea
        id={id}
        className={mono ? "mono" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        spellCheck={false}
        aria-describedby={invalid.length ? `${id}-invalid` : undefined}
      />
      {invalid.length > 0 && (
        <p id={`${id}-invalid`} className="invalid" role="alert">
          Unsupported: {invalid.join(" ")}
        </p>
      )}
    </div>
  );
}

/** Ticker tape that "prints" the Morse symbols one by one. */
function Tape({ morse, printId, active }) {
  const ref = useRef(null);
  const symbols = [...morse.slice(0, TAPE_LIMIT)];

  useEffect(() => {
    if (!ref.current || !symbols.length || reducedMotion()) return;
    const a = animate(ref.current.querySelectorAll(".sym"), {
      scale: [0, 1],
      opacity: [0, 1],
      translateY: [-10, 0],
      delay: stagger(14),
      duration: 260,
      ease: "outBack",
    });
    return () => a.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printId]);

  if (!symbols.length) return null;
  return (
    <div className="tape" ref={ref} aria-hidden="true">
      {symbols.map((c, i) => (
        <span
          key={i}
          className={`sym ${c === "." ? "dot" : c === "-" ? "dash" : c === "/" ? "slash" : "gap"}${i === active ? " active" : ""}`}
        />
      ))}
      {morse.length > TAPE_LIMIT && <span className="more">…</span>}
    </div>
  );
}

export default function App() {
  const [english, setEnglish] = useState("");
  const [morse, setMorse] = useState("");
  const [invalidEnglish, setInvalidEnglish] = useState([]);
  const [invalidMorse, setInvalidMorse] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [band, setBand] = useState(false);
  const [printId, setPrintId] = useState(0);
  const [burst, setBurst] = useState({ text: "", x: 0, y: 0, id: 0 });
  const [tapping, setTapping] = useState(false);
  const [activeSym, setActiveSym] = useState(-1);
  const rafRef = useRef(0);

  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const burstRef = useRef(null);

  // Opening-night entrance: card drops in, title letters bounce.
  useEffect(() => {
    if (reducedMotion()) return;
    const anims = [
      animate(cardRef.current, {
        translateY: [-60, 0],
        rotate: [-4, 0],
        opacity: [0, 1],
        duration: 900,
        ease: "outElastic(1, .7)",
      }),
      animate(titleRef.current.querySelectorAll(".ch"), {
        translateY: [{ to: -28, duration: 260, ease: "outQuad" }, { to: 0, duration: 520, ease: "outBounce" }],
        delay: stagger(45, { start: 300 }),
      }),
    ];
    return () => anims.forEach((a) => a.revert());
  }, []);

  useEffect(() => {
    if (!burst.id || !burstRef.current || reducedMotion()) return;
    const a = animate(burstRef.current, {
      scale: [0.2, 1.25, 1],
      rotate: [-20, 8],
      opacity: [{ to: 1, duration: 80 }, { to: 0, duration: 300, delay: 450 }],
      duration: 500,
      ease: "outBack",
    });
    return () => a.revert();
  }, [burst.id]);

  useEffect(
    () => () => {
      stopMarch();
      stopMorse();
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  function stopTapping() {
    cancelAnimationFrame(rafRef.current);
    stopMorse();
    setTapping(false);
    setActiveSym(-1);
  }

  // Play the Morse box as beeps and light up each symbol on the tape as it sounds.
  function startTapping() {
    const { events, endTime } = playMorse(morse);
    setTapping(true);
    let last = -1;
    const tick = () => {
      const now = audioTime();
      if (now >= endTime) {
        stopTapping();
        return;
      }
      const ev = events.find((e) => now >= e.start && now < e.end);
      const idx = ev ? ev.index : -1;
      if (idx !== last) {
        last = idx;
        setActiveSym(idx);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  // Editing either box makes the current playback stale.
  function editEnglish(v) {
    if (tapping) stopTapping();
    setEnglish(v);
  }
  function editMorse(v) {
    if (tapping) stopTapping();
    setMorse(v);
  }

  function pow(e) {
    const r = e.currentTarget.getBoundingClientRect();
    setBurst((b) => ({
      text: BURSTS[Math.floor(Math.random() * BURSTS.length)],
      x: r.left + r.width / 2,
      y: r.top,
      id: b.id + 1,
    }));
  }

  function shake() {
    if (!reducedMotion()) {
      animate(cardRef.current, { translateX: [0, -10, 10, -6, 6, 0], duration: 400, ease: "inOutSine" });
    }
  }

  const clearMessages = () => {
    setInvalidEnglish([]);
    setInvalidMorse([]);
    setError("");
  };

  async function run(direction, e) {
    pow(e);
    if (tapping) stopTapping();
    const [source, setTarget, setInvalid, translate] =
      direction === "toMorse"
        ? [english, setMorse, setInvalidEnglish, toMorse]
        : [morse, setEnglish, setInvalidMorse, toEnglish];

    clearMessages();
    if (!source.trim()) {
      setTarget("");
      return;
    }
    setBusy(true);
    try {
      const { result, invalid } = await translate(source);
      setTarget(result);
      setInvalid(invalid);
      if (invalid.length) shake();
      setPrintId((n) => n + 1);
    } catch (err) {
      setError(err.message || "Could not reach the translator API.");
      shake();
    } finally {
      setBusy(false);
    }
  }

  function toggleBand() {
    if (band) stopMarch();
    else startMarch();
    setBand(!band);
  }

  return (
    <>
      <Stage />

      <button type="button" className="band-toggle" onClick={toggleBand} aria-pressed={band}>
        {band ? "🎺 Band: playing" : "🎺 Strike up the band"}
      </button>

      <main className="app">
        <h1 ref={titleRef} aria-label={TITLE}>
          {[...TITLE].map((c, i) => (
            <span key={i} className="ch" aria-hidden="true">
              {c === " " ? " " : c}
            </span>
          ))}
        </h1>
        <p className="tagline">A Morse-ical comedy in dots &amp; dashes</p>

        <section className="card" ref={cardRef}>
          <div className="stamp" aria-hidden="true">
            TELEGRAM
          </div>

          <Field
            id="english"
            label="English"
            placeholder="Type English text…"
            value={english}
            onChange={editEnglish}
            invalid={invalidEnglish}
          />

          <div className="actions">
            <button type="button" onClick={(e) => run("toMorse", e)} disabled={busy}>
              ↓ To Morse
            </button>
            <button type="button" onClick={(e) => run("toEnglish", e)} disabled={busy}>
              ↑ To English
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (tapping) stopTapping();
                setEnglish("");
                setMorse("");
                clearMessages();
              }}
              disabled={busy}
            >
              Clear
            </button>
          </div>

          <Field
            id="morse"
            label="Morse"
            placeholder="e.g. .... .. / - .... . .-. ."
            value={morse}
            onChange={editMorse}
            invalid={invalidMorse}
            mono
          >
            <button
              type="button"
              className={`tap${tapping ? " playing" : ""}`}
              onClick={tapping ? stopTapping : startTapping}
              disabled={!tapping && !/[.-]/.test(morse)}
              title="Play the Morse code as telegraph beeps"
            >
              {tapping ? "■ Stop" : "▶ Tap it out"}
            </button>
          </Field>

          <Tape morse={morse} printId={printId} active={activeSym} />

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <p className="hint">
            Separate Morse letters with a space and words with <code>/</code> (or two or more spaces).
          </p>
        </section>
      </main>

      {burst.id > 0 && (
        <div key={burst.id} className="burst-anchor" style={{ left: burst.x, top: burst.y }} aria-hidden="true">
          <div ref={burstRef} className="burst">
            {burst.text}
          </div>
        </div>
      )}
    </>
  );
}
