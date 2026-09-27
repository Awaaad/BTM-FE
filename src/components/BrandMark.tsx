interface Props {
  /** Rendered height in px; width follows the mark's wider aspect. */
  size?: number
  className?: string
}

const VIEW_W = 72
const VIEW_H = 56

/**
 * The organisation's mark: a mosque standing inside a cave mouth.
 * Drawn as one emblem rather than two icons side by side.
 *
 * The cave is deliberately wider than tall and slightly asymmetric — a
 * symmetrical arch reads as a dome or a bell instead of rock.
 * Strokes use currentColor so it works on the dark login backdrop.
 */
export default function BrandMark({ size = 76, className }: Props) {
  return (
    <svg
      className={className}
      height={size}
      width={(size * VIEW_W) / VIEW_H}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Mosque inside a cave"
    >
      {/* cave mouth, in rock */}
      <path d="M4 52C4 34 8 20 16 13c7-6.2 15-8.5 22-7.8 9 .8 18 6.8 23 15.8 4 7 6 18 6 31" />
      {/* ground */}
      <path d="M2 52h68" />

      {/* mosque: finial, dome, prayer hall */}
      <path d="M36 17v3.5" />
      <path d="M27 30a9 9 0 0 1 18 0" />
      <path d="M27 30v22" />
      <path d="M45 30v22" />
      {/* arched doorway */}
      <path d="M32.5 52v-7a3.5 3.5 0 0 1 7 0v7" />
      {/* minarets */}
      <path d="M20 52V33" />
      <path d="M18.4 33a1.6 1.6 0 0 1 3.2 0" />
      <path d="M52 52V33" />
      <path d="M50.4 33a1.6 1.6 0 0 1 3.2 0" />
    </svg>
  )
}
