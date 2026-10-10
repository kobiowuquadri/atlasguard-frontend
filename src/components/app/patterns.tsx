import { cn } from '@/lib/utils';

/*
 * Topographic contour field — AtlasGuard's background motif (an atlas, measured).
 * Nested closed curves are generated deterministically (no randomness), so server and
 * client render identical markup.
 */

type Point = [number, number];

const round = (v: number) => Math.round(v);

/** Closed Catmull-Rom spline through the points, as cubic Béziers. */
function closedSpline(points: Point[]): string {
  const n = points.length;
  let d = `M${round(points[0]![0])} ${round(points[0]![1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    const p3 = points[(i + 2) % n]!;
    d += `C${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)} ${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(
      p2[1] - (p3[1] - p1[1]) / 6,
    )} ${round(p2[0])} ${round(p2[1])}`;
  }
  return `${d}Z`;
}

interface Peak {
  x: number;
  y: number;
  rings: number;
  start: number;
  step: number;
  phase: number;
  squash: number;
}

function contourRings(peak: Peak, samples = 44): string[] {
  const out: string[] = [];
  for (let i = 0; i < peak.rings; i++) {
    const r = peak.start + i * peak.step;
    const points: Point[] = [];
    for (let k = 0; k < samples; k++) {
      const t = (k / samples) * Math.PI * 2;
      // Low harmonics whose phase drifts per ring, so neighbouring lines morph like terrain.
      const wobble =
        0.11 * Math.sin(2 * t + peak.phase + i * 0.21) +
        0.07 * Math.sin(3 * t - peak.phase * 1.3 + i * 0.33) +
        0.035 * Math.sin(5 * t + peak.phase * 0.7 - i * 0.17);
      const rr = r * (1 + wobble);
      points.push([peak.x + rr * Math.cos(t), peak.y + rr * Math.sin(t) * peak.squash]);
    }
    out.push(closedSpline(points));
  }
  return out;
}

const PRESETS = {
  hero: [
    { x: 880, y: 300, rings: 16, start: 26, step: 34, phase: 0.6, squash: 0.78 },
    { x: 180, y: 720, rings: 10, start: 30, step: 38, phase: 2.1, squash: 0.85 },
  ],
  panel: [{ x: 1010, y: 40, rings: 12, start: 24, step: 30, phase: 1.4, squash: 0.8 }],
  corner: [{ x: 1150, y: 760, rings: 10, start: 30, step: 34, phase: 2.6, squash: 0.82 }],
} satisfies Record<string, Peak[]>;

const CACHE = new Map<string, Array<{ d: string; accent: boolean }>>();

function paths(preset: keyof typeof PRESETS) {
  let cached = CACHE.get(preset);
  if (!cached) {
    cached = PRESETS[preset].flatMap((peak) => contourRings(peak).map((d, i) => ({ d, accent: i % 5 === 3 })));
    CACHE.set(preset, cached);
  }
  return cached;
}

export function ContourField({ className, preset = 'hero' }: { className?: string; preset?: keyof typeof PRESETS }) {
  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    >
      <g fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke">
        {paths(preset).map((p, i) => (
          <path key={i} d={p.d} stroke={p.accent ? 'rgb(139 92 246 / 0.32)' : 'rgb(255 255 255 / 0.055)'} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}

/** Dotted grid with a soft violet bloom — sits behind hero content. */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-dot-grid mask-radial" />
      <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(124_58_237/0.22),transparent)]" />
    </div>
  );
}
