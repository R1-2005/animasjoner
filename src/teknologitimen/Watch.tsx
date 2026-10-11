import { afp } from "./sign";

// Påskeegg: IT-arkitekten har alltid en ny klokke på. Hver gang en hanske kommer inn, er det en annen
// kombinasjon av skive (svart / hvit / blå) og reim (svart / brun).
export const WATCHES = [
  { dial: afp.ink, strap: afp.ink },
  { dial: afp.white, strap: afp.leather },
  { dial: afp.watchBlue, strap: afp.ink },
  { dial: afp.white, strap: afp.ink },
  { dial: afp.watchBlue, strap: afp.leather },
  { dial: afp.ink, strap: afp.leather },
];

// Armbåndsur over ermet. Tegnet med armen langs +y; `rotate` snur det for armer langs +x.
export const Watch: React.FC<{ x: number; y: number; variant: number; rotate?: number }> = ({
  x,
  y,
  variant,
  rotate = 0,
}) => {
  const { dial, strap } = WATCHES[variant % WATCHES.length];
  const hands = dial === afp.white ? afp.ink : afp.white;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x={-40} y={-9} width={80} height={18} rx={3} fill={strap} stroke={afp.ink} strokeWidth={3} />
      <circle r={18} fill={afp.metal} stroke={afp.ink} strokeWidth={3} />
      <circle r={13} fill={dial} />
      {/* Klassisk 10:10 */}
      <line x1={0} y1={0} x2={-7} y2={-5} stroke={hands} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={0} y1={0} x2={9} y2={-7} stroke={hands} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
};
