import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import './continental.css'

const chapterCards = [
  {
    eyebrow: '01',
    title: 'Pangaea reconstruction',
    text: 'Drag continents back together and discover how their coastlines, rocks, and fossils align.',
  },
  {
    eyebrow: '02',
    title: 'Evidence for drift',
    text: 'Explore Wegener’s fossil, climate, rock, and coastline clues through animated evidence cards.',
  },
  {
    eyebrow: '03',
    title: 'Timeline of motion',
    text: 'Scrub from 300 million years ago to today and watch continents migrate across the planet.',
  },
  {
    eyebrow: '04',
    title: 'Plate tectonics simulator',
    text: 'Test divergent, convergent, and transform boundaries with interactive SVG plate motion.',
  },
]

function RotatingEarth() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="cd-earth-stage" aria-label="Animated rotating Earth">
      <motion.div
        className="cd-earth-orbit"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
      />
      <svg className="cd-earth" viewBox="0 0 420 420" role="img" aria-label="Stylized Earth">
        <defs>
          <radialGradient id="earthOcean" cx="38%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#68d8ff" />
            <stop offset="48%" stopColor="#1779b8" />
            <stop offset="100%" stopColor="#09284f" />
          </radialGradient>
          <linearGradient id="landGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#c7a66b" />
            <stop offset="55%" stopColor="#5fa16b" />
            <stop offset="100%" stopColor="#2d6f4a" />
          </linearGradient>
          <clipPath id="earthClip">
            <circle cx="210" cy="210" r="164" />
          </clipPath>
          <filter id="earthGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="210" cy="210" r="164" fill="url(#earthOcean)" filter="url(#earthGlow)" />
        <g clipPath="url(#earthClip)">
          <motion.g
            animate={reduceMotion ? undefined : { x: [-20, 16, -20] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M95 125 C132 87 190 93 204 130 C217 164 178 174 188 205 C198 235 160 264 122 246 C88 230 66 164 95 125 Z"
              fill="url(#landGrad)"
            />
            <path
              d="M232 78 C282 83 337 123 333 174 C329 226 276 220 265 259 C253 304 202 296 195 248 C189 210 232 196 218 158 C208 129 197 94 232 78 Z"
              fill="url(#landGrad)"
            />
            <path
              d="M292 285 C331 277 378 302 378 350 C378 390 323 400 297 371 C276 348 250 299 292 285 Z"
              fill="url(#landGrad)"
            />
            <path
              d="M48 276 C80 253 116 265 126 301 C136 338 102 357 73 338 C47 321 28 291 48 276 Z"
              fill="url(#landGrad)"
            />
          </motion.g>
          <path d="M52 118 C130 78 277 66 372 128" className="cd-earth-line" />
          <path d="M47 228 C148 197 270 206 377 250" className="cd-earth-line" />
          <path d="M90 343 C174 312 272 316 346 354" className="cd-earth-line" />
        </g>
        <circle cx="210" cy="210" r="164" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      </svg>

      <motion.div
        className="cd-scan-card cd-scan-card--one"
        animate={{ y: [0, -8, 0], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        Plate velocity: 2–10 cm/year
      </motion.div>
      <motion.div
        className="cd-scan-card cd-scan-card--two"
        animate={{ y: [0, 10, 0], opacity: [0.55, 0.95, 0.55] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        Fossils align across oceans
      </motion.div>
    </div>
  )
}

export function ContinentalDriftApp() {
  const [started, setStarted] = useState(false)

  return (
    <main className="cd-root">
      <section className="cd-hero" aria-labelledby="continental-title">
        <div className="cd-hero__content">
          <motion.p
            className="cd-kicker"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Interactive science museum
          </motion.p>
          <motion.h1
            id="continental-title"
            className="cd-title"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
          >
            Continental Drift:
            <span>The Moving Earth</span>
          </motion.h1>
          <motion.p
            className="cd-intro"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
          >
            Continents are not fixed. They drift, collide, split, and rebuild the surface of
            our planet over millions of years. Start with the evidence, then follow the plates.
          </motion.p>
          <motion.div
            className="cd-actions"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
          >
            <button className="cd-start" type="button" onClick={() => setStarted(true)}>
              Start experience
            </button>
            <span className="cd-note">Designed for exploration, animation, and classroom display.</span>
          </motion.div>
        </div>

        <motion.div
          className="cd-hero__visual"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <RotatingEarth />
        </motion.div>
      </section>

      <motion.section
        className={`cd-roadmap${started ? ' cd-roadmap--active' : ''}`}
        initial={false}
        animate={started ? { opacity: 1, y: 0 } : { opacity: 0.72, y: 8 }}
        transition={{ duration: 0.45 }}
        aria-label="Experience roadmap"
      >
        <div className="cd-section-heading">
          <p>Experience map</p>
          <h2>{started ? 'Next: build the Pangaea reconstruction' : 'What this experience will become'}</h2>
        </div>
        <div className="cd-card-grid">
          {chapterCards.map((card, index) => (
            <motion.article
              key={card.title}
              className="cd-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 * index }}
            >
              <span>{card.eyebrow}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </main>
  )
}
