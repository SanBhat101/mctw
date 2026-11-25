import { useEffect, useRef } from "react";
import { animate, createScope, createTimeline, stagger, steps } from "animejs";

/*
 * Decorative background: a Broadway "guaranteed flop" opening night, starring a
 * ranting, tomato-pelted cartoon dictator. Pure satire: he is the butt of every
 * joke, and no Nazi insignia or salutes are drawn.
 */

const RAYS = Array.from({ length: 24 }, (_, i) => i);
const BULBS = Array.from({ length: 22 }, (_, i) => i);
const KICKERS = Array.from({ length: 4 }, (_, i) => i);

// Dictator placement in scene coordinates; used to aim the tomato.
const DICT_X = 150;
const DICT_Y = 420;
const DICT_SCALE = 1.4;
const HEAD_X = DICT_X + 100 * DICT_SCALE;
const HEAD_Y = DICT_Y + 70 * DICT_SCALE;
const TOMATO_START_X = 1700;
const TOMATO_START_Y = 200;

function Dictator() {
  return (
    <g transform={`translate(${DICT_X} ${DICT_Y}) scale(${DICT_SCALE})`}>
      <g className="dict">
        {/* legs + boots */}
        <line x1="82" y1="205" x2="78" y2="268" stroke="#111" strokeWidth="26" strokeLinecap="round" />
        <line x1="118" y1="205" x2="122" y2="268" stroke="#111" strokeWidth="26" strokeLinecap="round" />
        <line x1="82" y1="205" x2="78" y2="268" stroke="#6f6343" strokeWidth="17" strokeLinecap="round" />
        <line x1="118" y1="205" x2="122" y2="268" stroke="#6f6343" strokeWidth="17" strokeLinecap="round" />
        <ellipse cx="70" cy="276" rx="20" ry="10" fill="#111" />
        <ellipse cx="130" cy="276" rx="20" ry="10" fill="#111" />

        {/* hip arm */}
        <polyline points="64,130 38,160 62,178" fill="none" stroke="#111" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="64,130 38,160 62,178" fill="none" stroke="#8b7d55" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />

        {/* torso */}
        <rect x="58" y="112" width="84" height="102" rx="16" fill="#8b7d55" stroke="#111" strokeWidth="5" />
        <rect x="58" y="168" width="84" height="13" fill="#3b2a1a" stroke="#111" strokeWidth="3" />
        <rect x="93" y="166" width="14" height="17" rx="2" fill="#d9b44a" stroke="#111" strokeWidth="3" />
        <circle cx="100" cy="132" r="3.5" fill="#d9b44a" stroke="#111" strokeWidth="1.5" />
        <circle cx="100" cy="150" r="3.5" fill="#d9b44a" stroke="#111" strokeWidth="1.5" />
        <circle cx="100" cy="198" r="3.5" fill="#d9b44a" stroke="#111" strokeWidth="1.5" />
        <path d="M80 112 L100 128 L120 112" fill="#a8996b" stroke="#111" strokeWidth="4" strokeLinejoin="round" />

        {/* conducting arm, waving a baton */}
        <g className="dict-arm">
          <line x1="138" y1="128" x2="176" y2="82" stroke="#111" strokeWidth="25" strokeLinecap="round" />
          <line x1="138" y1="128" x2="176" y2="82" stroke="#8b7d55" strokeWidth="16" strokeLinecap="round" />
          <line x1="178" y1="80" x2="206" y2="34" stroke="#111" strokeWidth="7" strokeLinecap="round" />
          <line x1="178" y1="80" x2="206" y2="34" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <circle cx="178" cy="80" r="11" fill="#f3cfae" stroke="#111" strokeWidth="4" />
        </g>

        {/* head */}
        <g className="dict-head">
          <circle cx="61" cy="76" r="10" fill="#f3cfae" stroke="#111" strokeWidth="4" />
          <circle cx="139" cy="76" r="10" fill="#f3cfae" stroke="#111" strokeWidth="4" />
          <ellipse cx="100" cy="70" rx="40" ry="46" fill="#f3cfae" stroke="#111" strokeWidth="5" />
          {/* the infamous comb-over, flopping over one eye */}
          <path d="M60 64 Q60 22 100 24 Q142 24 142 58 Q124 42 98 44 Q80 54 64 84 Z" fill="#1a1a1a" stroke="#111" strokeWidth="3" />
          <line x1="74" y1="57" x2="94" y2="64" stroke="#111" strokeWidth="5" strokeLinecap="round" />
          <line x1="126" y1="57" x2="106" y2="64" stroke="#111" strokeWidth="5" strokeLinecap="round" />
          <circle cx="86" cy="73" r="9" fill="#fff" stroke="#111" strokeWidth="3" />
          <circle cx="114" cy="73" r="9" fill="#fff" stroke="#111" strokeWidth="3" />
          <circle cx="88" cy="75" r="3.5" fill="#111" />
          <circle cx="112" cy="75" r="3.5" fill="#111" />
          <path d="M100 74 Q108 86 97 89" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
          <rect className="dict-stache" x="88" y="89" width="24" height="12" rx="2" fill="#111" />
          <ellipse className="dict-mouth" cx="100" cy="109" rx="10" ry="7" fill="#6b1010" stroke="#111" strokeWidth="3" />
        </g>
      </g>
    </g>
  );
}

function Curtain({ side }) {
  const flip = side === "right" ? "translate(1600 0) scale(-1 1)" : undefined;
  return (
    <g transform={flip}>
      <g className={`curtain curtain-${side}`}>
        <path d="M0 0 H220 Q170 300 200 560 Q150 760 190 900 H0 Z" fill="#9e1b1b" stroke="#111" strokeWidth="6" />
        <path d="M60 0 Q40 420 70 900" fill="none" stroke="#6d0f0f" strokeWidth="10" />
        <path d="M130 0 Q100 420 130 900" fill="none" stroke="#6d0f0f" strokeWidth="10" />
      </g>
    </g>
  );
}

export default function Stage() {
  const root = useRef(null);
  const scope = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    scope.current = createScope({ root }).add(() => {
      animate(".rays", { rotate: 360, duration: 90000, ease: "linear", loop: true });

      animate(".spot-l", { rotate: [-12, 14], duration: 3200, ease: "inOutSine", loop: true, alternate: true });
      animate(".spot-r", { rotate: [12, -14], duration: 3700, ease: "inOutSine", loop: true, alternate: true });

      animate(".bulb", {
        opacity: [1, 0.25],
        duration: 450,
        delay: stagger(70),
        ease: steps(2),
        loop: true,
        alternate: true,
      });

      animate(".curtain", { scaleX: [1, 1.04], duration: 4000, ease: "inOutSine", loop: true, alternate: true });

      // The dictator rants: hops, flails his baton, mustache twitches.
      animate(".dict", { translateY: [0, -14], duration: 420, ease: "outQuad", loop: true, alternate: true });
      animate(".dict-arm", { rotate: [-25, 30], duration: 380, ease: "inOutQuad", loop: true, alternate: true });
      animate(".dict-head", { rotate: [-7, 7], duration: 520, ease: "inOutSine", loop: true, alternate: true });
      animate(".dict-mouth", { scaleY: [0.4, 1.6], duration: 210, ease: "inOutQuad", loop: true, alternate: true });
      animate(".dict-stache", { scaleX: [1, 1.35], duration: 160, ease: "inOutQuad", loop: true, alternate: true });

      animate(".kick-leg", {
        rotate: [0, -85],
        duration: 520,
        delay: stagger(130),
        ease: "inOutQuad",
        loop: true,
        alternate: true,
      });

      // A critic's tomato every few seconds. SPLAT.
      createTimeline({ loop: true, loopDelay: 2600 })
        .add(".tomato", {
          translateX: [0, HEAD_X - TOMATO_START_X],
          translateY: [0, HEAD_Y - TOMATO_START_Y],
          opacity: [1, 1],
          duration: 900,
          ease: "inQuad",
        })
        .add(".tomato", { opacity: 0, duration: 1 })
        .add(".splat", { scale: [0, 1.15], opacity: [1, 1], duration: 220, ease: "outBack" }, "<")
        .add(".bubble", { scale: [0, 1], opacity: [0, 1], duration: 320, ease: "outElastic(1, .6)" }, "<<+=80")
        .add([".splat", ".bubble"], { opacity: 0, duration: 400, delay: 1300 })
        .add(".tomato", { translateX: 0, translateY: 0, duration: 1 });
    });

    return () => scope.current?.revert();
  }, []);

  return (
    <div className="stage" ref={root} aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <pattern id="halftone" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="2.4" fill="#000" opacity="0.12" />
          </pattern>
        </defs>

        <rect width="1600" height="900" fill="#ffcc33" />
        <g className="rays">
          {RAYS.filter((i) => i % 2 === 0).map((i) => (
            <polygon
              key={`r${i}`}
              points="800,900 700,-900 900,-900"
              transform={`rotate(${(i * 360) / RAYS.length} 800 900)`}
              fill="#ff9f1c"
            />
          ))}
        </g>
        <rect width="1600" height="900" fill="url(#halftone)" />

        <polygon className="spot spot-l" points="260,0 120,900 520,900" fill="#fff8d0" opacity="0.35" />
        <polygon className="spot spot-r" points="1340,0 1080,900 1480,900" fill="#fff8d0" opacity="0.35" />

        {/* stage floor */}
        <rect y="800" width="1600" height="100" fill="#5a3a1e" stroke="#111" strokeWidth="6" />

        {/* marquee */}
        <g transform="translate(800 112)">
          <rect x="-330" y="-50" width="660" height="110" rx="10" fill="#1b1b2f" stroke="#111" strokeWidth="6" />
          {BULBS.map((i) => {
            const t = i / BULBS.length;
            const x = -315 + ((t * 2 * 630) % 630);
            const y = t < 0.5 ? -38 : 48;
            return <circle key={i} className="bulb" cx={x} cy={y} r="6" fill="#ffe066" stroke="#111" strokeWidth="2" />;
          })}
          <text x="0" y="0" textAnchor="middle" className="marquee-title">
            OPENING NIGHT!
          </text>
          <text x="0" y="32" textAnchor="middle" className="marquee-sub">
            A GUARANTEED FLOP IN DOTS &amp; DASHES
          </text>
        </g>

        <Dictator />

        <g transform={`translate(${HEAD_X} ${HEAD_Y})`}>
          <g className="splat">
          <path
            d="M0 -38 L10 -14 L36 -22 L18 0 L40 18 L12 16 L6 42 L-8 18 L-34 30 L-20 4 L-42 -12 L-14 -14 Z"
            fill="#d62828"
            stroke="#111"
            strokeWidth="4"
          />
          </g>
        </g>
        <circle className="tomato" cx={TOMATO_START_X} cy={TOMATO_START_Y} r="22" fill="#e63946" stroke="#111" strokeWidth="4" />

        {/* above his head, clear of the curtain (left) and the telegram card (right) */}
        <g transform={`translate(${HEAD_X - 90} ${HEAD_Y - 215})`}>
          <g className="bubble">
          <path d="M0 0 H210 V80 H115 L88 125 L82 80 H0 Z" fill="#fff" stroke="#111" strokeWidth="5" strokeLinejoin="round" />
          <text x="105" y="51" textAnchor="middle" className="bubble-text">
            ACH! CRITICS!
          </text>
          </g>
        </g>

        {/* the chorus line: top hats, sequins, high kicks */}
        <g transform="translate(1170 600) scale(0.85)">
          {KICKERS.map((i) => (
            <g key={i} transform={`translate(${i * 72} 0)`}>
              <line x1="-6" y1="120" x2="-8" y2="230" stroke="#111" strokeWidth="18" strokeLinecap="round" />
              <line x1="-6" y1="120" x2="-8" y2="230" stroke="#f2c6a0" strokeWidth="11" strokeLinecap="round" />
              <ellipse cx="-12" cy="234" rx="13" ry="7" fill="#111" />
              <g className="kick-leg">
                <line x1="8" y1="120" x2="8" y2="230" stroke="#111" strokeWidth="18" strokeLinecap="round" />
                <line x1="8" y1="120" x2="8" y2="230" stroke="#f2c6a0" strokeWidth="11" strokeLinecap="round" />
                <ellipse cx="12" cy="234" rx="13" ry="7" fill="#111" />
              </g>
              <path d="M-16 60 Q0 50 16 60 L20 112 L-20 112 Z" fill="#ff4fa3" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
              <path d="M-30 108 L30 108 L24 128 L-24 128 Z" fill="#ff85c0" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
              <circle cx="0" cy="38" r="17" fill="#f2c6a0" stroke="#111" strokeWidth="4" />
              <path d="M-9 34 Q-6 31 -3 34 M3 34 Q6 31 9 34" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M-7 43 Q0 50 7 43" fill="#b5172a" stroke="#111" strokeWidth="2.5" />
              <rect x="-15" y="0" width="30" height="22" fill="#111" />
              <rect x="-22" y="20" width="44" height="6" rx="2" fill="#111" />
              <rect x="-15" y="12" width="30" height="5" fill="#ff4fa3" />
            </g>
          ))}
        </g>

        <Curtain side="left" />
        <Curtain side="right" />
        <path d="M0 0 H1600 V22 Q1400 56 1200 22 Q1000 56 800 22 Q600 56 400 22 Q200 56 0 22 Z" fill="#7d1414" stroke="#111" strokeWidth="6" />
      </svg>
    </div>
  );
}
