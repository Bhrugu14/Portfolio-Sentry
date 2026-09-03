'use client'

import { useEffect, useRef } from 'react'

export type BackgroundEffectKind = 'none' | 'particles' | 'ripple' | 'orbs' | 'aurora' | 'dust'

/**
 * A decorative full-page background animation, colored entirely from the
 * theme's own CSS custom properties (--accent/--border) so it can never
 * clash with whatever colors are configured in Studio. Fixed, behind
 * content (-z-10), aria-hidden, pointer-events-none. Each variant skips
 * its own animation loop for prefers-reduced-motion (checked client-side,
 * inside effects — never at render time, so this stays SSR-safe).
 */
export function BackgroundEffect({ kind }: { kind: BackgroundEffectKind | null | undefined }) {
  switch (kind) {
    case 'particles':
      return <ParticleNetwork />
    case 'ripple':
      return <RippleGrid />
    case 'orbs':
      return <MagneticOrbs />
    case 'aurora':
      return <AuroraDrift />
    case 'dust':
      return <FloatingDust />
    default:
      return null
  }
}

// ---- shared canvas scaffolding (particles / ripple / dust) ----

type Pointer = { x: number; y: number }
type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, pointer: Pointer | null) => void

function readThemeColors() {
  const style = getComputedStyle(document.documentElement)
  return {
    accent: style.getPropertyValue('--accent').trim() || '#6366f1',
    border: style.getPropertyValue('--border').trim() || '#e4e4e7',
  }
}

/** Mounts a full-viewport canvas and runs `draw` every frame. Reduced-motion
 * visitors get a blank (never-drawn-to) canvas — same "skip inside the
 * effect" pattern CursorGlow uses, so there's no render-time branching and
 * no hydration mismatch. */
function useAnimatedCanvas(draw: DrawFn, { interactive = false, onReady }: { interactive?: boolean; onReady?: (width: number, height: number) => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    drawRef.current = draw
    onReadyRef.current = onReady
  }, [draw, onReady])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let ready = false

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!ready) {
        ready = true
        onReadyRef.current?.(width, height)
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const pointer: Pointer | null = interactive ? { x: -9999, y: -9999 } : null
    function handleMove(event: PointerEvent) {
      pointer!.x = event.clientX
      pointer!.y = event.clientY
    }
    function handleLeave() {
      pointer!.x = -9999
      pointer!.y = -9999
    }
    if (interactive) {
      window.addEventListener('pointermove', handleMove)
      document.documentElement.addEventListener('mouseleave', handleLeave)
    }

    let raf = 0
    const start = performance.now()
    function tick(now: number) {
      drawRef.current(ctx!, width, height, (now - start) / 1000, pointer)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      if (interactive) {
        window.removeEventListener('pointermove', handleMove)
        document.documentElement.removeEventListener('mouseleave', handleLeave)
      }
    }
  }, [interactive])

  return canvasRef
}

const CANVAS_CLASS = 'pointer-events-none fixed inset-0 -z-10'

function particleCountFor(width: number, height: number) {
  return Math.round(Math.min(80, Math.max(28, (width * height) / 22000)))
}

// ---- 1. Particle Network (interactive) ----

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

function ParticleNetwork() {
  const particlesRef = useRef<Particle[]>([])
  const colorsRef = useRef(readThemeColorsFallback())

  const canvasRef = useAnimatedCanvas(
    (ctx, width, height, _time, pointer) => {
      const particles = particlesRef.current
      const { accent, border } = colorsRef.current
      const LINK_DIST = 130

      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
      }

      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < LINK_DIST) {
            ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.25
            ctx.strokeStyle = border
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        if (pointer) {
          const dist = Math.hypot(particles[i].x - pointer.x, particles[i].y - pointer.y)
          if (dist < 160) {
            ctx.globalAlpha = (1 - dist / 160) * 0.5
            ctx.strokeStyle = accent
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(pointer.x, pointer.y)
            ctx.stroke()
          }
        }
      }

      ctx.globalAlpha = 0.6
      ctx.fillStyle = accent
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
    {
      interactive: true,
      onReady: (width, height) => {
        colorsRef.current = readThemeColors()
        particlesRef.current = Array.from({ length: particleCountFor(width, height) }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        }))
      },
    },
  )

  return <canvas ref={canvasRef} aria-hidden="true" className={CANVAS_CLASS} />
}

// ---- 2. Ripple Grid (interactive) ----

interface Ripple {
  x: number
  y: number
  start: number
}

function RippleGrid() {
  const ripplesRef = useRef<Ripple[]>([])
  const colorsRef = useRef(readThemeColorsFallback())
  const lastAddRef = useRef(0)

  const canvasRef = useAnimatedCanvas(
    (ctx, width, height, time, pointer) => {
      const { accent, border } = colorsRef.current
      const LIFETIME = 1.4
      const SPEED = 240
      const BAND = 40
      const SPACING = 36

      if (pointer && pointer.x >= 0 && time - lastAddRef.current > 0.09) {
        ripplesRef.current.push({ x: pointer.x, y: pointer.y, start: time })
        lastAddRef.current = time
        if (ripplesRef.current.length > 6) ripplesRef.current.shift()
      }
      ripplesRef.current = ripplesRef.current.filter((r) => time - r.start < LIFETIME)

      ctx.clearRect(0, 0, width, height)

      for (let gx = SPACING / 2; gx < width; gx += SPACING) {
        for (let gy = SPACING / 2; gy < height; gy += SPACING) {
          let intensity = 0
          for (const r of ripplesRef.current) {
            const age = time - r.start
            const radius = age * SPEED
            const dist = Math.hypot(gx - r.x, gy - r.y)
            const band = Math.max(0, 1 - Math.abs(dist - radius) / BAND)
            intensity = Math.max(intensity, band * (1 - age / LIFETIME))
          }
          ctx.beginPath()
          if (intensity < 0.02) {
            ctx.globalAlpha = 0.12
            ctx.fillStyle = border
            ctx.arc(gx, gy, 1, 0, Math.PI * 2)
          } else {
            ctx.globalAlpha = 0.15 + intensity * 0.6
            ctx.fillStyle = accent
            ctx.arc(gx, gy, 1 + intensity * 2.5, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    },
    { interactive: true, onReady: () => { colorsRef.current = readThemeColors() } },
  )

  return <canvas ref={canvasRef} aria-hidden="true" className={CANVAS_CLASS} />
}

// ---- 3. Floating Dust (ambient) ----

interface DustMote {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  phase: number
}

function FloatingDust() {
  const dustRef = useRef<DustMote[]>([])
  const colorsRef = useRef(readThemeColorsFallback())

  const canvasRef = useAnimatedCanvas(
    (ctx, width, height, time) => {
      const { accent } = colorsRef.current
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = accent
      for (const d of dustRef.current) {
        const span = height + 20
        const y = (((d.y - time * d.speed) % span) + span) % span - 10
        const x = d.x + Math.sin(time * 0.3 + d.phase) * d.drift
        ctx.globalAlpha = 0.25
        ctx.beginPath()
        ctx.arc(x, y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
    {
      interactive: false,
      onReady: (width, height) => {
        colorsRef.current = readThemeColors()
        dustRef.current = Array.from({ length: 40 }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.8 + Math.random() * 1.8,
          speed: 6 + Math.random() * 10,
          drift: 10 + Math.random() * 20,
          phase: Math.random() * Math.PI * 2,
        }))
      },
    },
  )

  return <canvas ref={canvasRef} aria-hidden="true" className={CANVAS_CLASS} />
}

function readThemeColorsFallback() {
  return { accent: '#6366f1', border: '#e4e4e7' }
}

// ---- 4. Magnetic Orbs (interactive, DOM + CSS, no canvas) ----
//
// Anchored to the empty side gutters (not the center content column), each
// orb's `left`/`top` is its fixed home in CSS — JS only ever adds a small
// translate *delta* on top of that (drift + a gentle pull toward the
// pointer), so there's no snap-from-the-corner flash on load, and orbs
// never wander into the readable center.

const ORB_HOMES = [
  { left: '10%', top: '28%', size: 380, opacity: 0.22 },
  { left: '90%', top: '68%', size: 320, opacity: 0.18 },
]

function MagneticOrbs() {
  const orbRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const orbEls = orbRefs.current.filter((el): el is HTMLDivElement => el !== null)
    if (orbEls.length === 0) return

    const pointer = { x: -9999, y: -9999 }
    function handleMove(event: PointerEvent) {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }
    window.addEventListener('pointermove', handleMove)

    let homesPx = ORB_HOMES.map((home) => ({
      x: (parseFloat(home.left) / 100) * window.innerWidth,
      y: (parseFloat(home.top) / 100) * window.innerHeight,
    }))
    function resize() {
      homesPx = ORB_HOMES.map((home) => ({
        x: (parseFloat(home.left) / 100) * window.innerWidth,
        y: (parseFloat(home.top) / 100) * window.innerHeight,
      }))
    }
    window.addEventListener('resize', resize)

    let raf = 0
    const start = performance.now()
    function tick(now: number) {
      const t = (now - start) / 1000
      orbEls.forEach((el, i) => {
        const home = homesPx[i]
        const driftX = Math.sin(t * 0.15 + i * 2.1) * 40
        const driftY = Math.cos(t * 0.12 + i * 2.1) * 30
        const pull = pointer.x < 0 ? 0 : 0.08
        const dx = driftX + (pointer.x - home.x) * pull * 0.15
        const dy = driftY + (pointer.y - home.y) * pull * 0.15
        el.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {ORB_HOMES.map((home, i) => (
        <div
          key={i}
          ref={(el) => {
            orbRefs.current[i] = el
          }}
          className="absolute rounded-full blur-3xl"
          style={{
            left: home.left,
            top: home.top,
            width: home.size,
            height: home.size,
            opacity: home.opacity,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          }}
        />
      ))}
    </div>
  )
}

// ---- 5. Aurora Drift (ambient, pure CSS — keyframes + reduced-motion guard live in globals.css) ----

function AuroraDrift() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-aurora-blob bg-aurora-blob-1" />
      <div className="bg-aurora-blob bg-aurora-blob-2" />
      <div className="bg-aurora-blob bg-aurora-blob-3" />
    </div>
  )
}
