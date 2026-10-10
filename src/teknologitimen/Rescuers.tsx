import type { Rescuer } from "./events";
import type { V } from "./physics";
import { elbow } from "./physics";
import { afp, FLOOR } from "./sign";

const OUTLINE = 4;
const INK = afp.ink;

// Hvit tegneseriehanske i lilla erme. Lokalt peker fingrene oppover (-y) og armen nedover (+y).
const Hand: React.FC<{ r: Rescuer }> = ({ r }) => {
  const from = r.from ?? { x: r.hold.x, y: 2000 };
  const dx = from.x - r.hold.x;
  const dy = from.y - r.hold.y;
  const angle = (Math.atan2(-dx, dy) * 180) / Math.PI + (r.wiggle ?? 0);
  const curl = 1 - 0.3 * r.grip;
  const fingers = [44, 54, 52, 42];
  return (
    <g transform={`translate(${r.hold.x} ${r.hold.y}) rotate(${angle}) scale(1.35)`}>
      <rect x={-38} y={74} width={76} height={3200} fill={afp.purple} stroke={INK} strokeWidth={OUTLINE} />
      <rect
        x={-14}
        y={-6}
        width={26}
        height={60}
        rx={13}
        transform="rotate(-52 -44 40)"
        fill={afp.white}
        stroke={INK}
        strokeWidth={OUTLINE}
      />
      {fingers.map((len, i) => (
        <rect
          key={i}
          x={-46 + i * 23}
          y={14 - len * curl}
          width={23}
          height={len * curl + 20}
          rx={11.5}
          fill={afp.white}
          stroke={INK}
          strokeWidth={OUTLINE}
        />
      ))}
      <path d="M -46 18 Q -48 72 -30 76 L 30 76 Q 48 72 46 18 Z" fill={afp.white} stroke={INK} strokeWidth={OUTLINE} />
      {[-14, 0, 14].map((x) => (
        <line key={x} x1={x} y1={34} x2={x} y2={58} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      ))}
      <rect x={-46} y={68} width={92} height={26} rx={9} fill={afp.white} stroke={INK} strokeWidth={OUTLINE} />
    </g>
  );
};

// Industriell robotarm med to ledd og en griper som alltid peker rett ned.
const Arm: React.FC<{ r: Rescuer; frame: number }> = ({ r, frame }) => {
  const base = r.from ?? { x: -180, y: 1180 };
  const wrist = { x: r.hold.x, y: r.hold.y - 92 };
  const e = elbow(base, wrist, 640, 640);
  const seg = (a: V, b: V) => (
    <>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={62} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={afp.yellow} strokeWidth={52} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={afp.white} strokeWidth={8} strokeLinecap="round" opacity={0.5} />
    </>
  );
  const joint = (p: V, r1: number) => (
    <>
      <circle cx={p.x} cy={p.y} r={r1} fill={INK} />
      <circle cx={p.x} cy={p.y} r={r1 * 0.45} fill={afp.metal} />
    </>
  );
  const open = 1 - r.grip;
  const fx = 22 + 22 * open;
  const led = Math.sin(frame * 0.12) > 0 ? afp.coral : afp.metalDark;
  return (
    <g>
      {seg(base, e)}
      {seg(e, wrist)}
      {joint(base, 58)}
      {joint(e, 42)}
      <circle cx={e.x + 26} cy={e.y - 26} r={7} fill={led} stroke={INK} strokeWidth={2} />
      <line x1={wrist.x} y1={wrist.y} x2={wrist.x} y2={r.hold.y - 44} stroke={afp.metalDark} strokeWidth={20} />
      {joint(wrist, 26)}
      <rect x={wrist.x - 56} y={r.hold.y - 50} width={112} height={18} rx={6} fill={INK} />
      {[-1, 1].map((s) => (
        <rect
          key={s}
          x={wrist.x + s * fx - 8}
          y={r.hold.y - 40}
          width={16}
          height={64}
          rx={6}
          fill={afp.metalDark}
          stroke={INK}
          strokeWidth={3}
        />
      ))}
    </g>
  );
};

// Kranwire med gul krok-blokk.
const Crane: React.FC<{ r: Rescuer }> = ({ r }) => {
  const { x, y } = r.hold;
  return (
    <g transform={`translate(${x} ${y}) scale(1.5) translate(${-x} ${-y})`}>
      <line x1={x} y1={-400} x2={x} y2={y - 92} stroke={INK} strokeWidth={4} />
      <rect x={x - 30} y={y - 100} width={60} height={50} rx={8} fill={afp.yellow} stroke={INK} strokeWidth={OUTLINE} />
      <circle cx={x} cy={y - 82} r={9} fill={afp.metal} stroke={INK} strokeWidth={3} />
      <path
        d={`M ${x} ${y - 50} L ${x} ${y + 2} A 17 17 0 1 1 ${x - 32} ${y - 8}`}
        fill="none"
        stroke={INK}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <path
        d={`M ${x} ${y - 50} L ${x} ${y + 2} A 17 17 0 1 1 ${x - 32} ${y - 8}`}
        fill="none"
        stroke={afp.metal}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </g>
  );
};

// Drone med to synlige propeller og en wire ned til flisen.
const Drone: React.FC<{ r: Rescuer; frame: number }> = ({ r, frame }) => {
  const d = { x: r.hold.x, y: r.hold.y - 200 };
  const prop = (s: number) => 12 + 56 * Math.abs(Math.sin(frame * 1.7 + s));
  const led = Math.sin(frame * 0.15) > 0.3 ? afp.coral : afp.purple800;
  return (
    <g>
      <line x1={d.x} y1={d.y + 20} x2={r.hold.x} y2={r.hold.y - 14} stroke={INK} strokeWidth={3} />
      <circle cx={r.hold.x} cy={r.hold.y - 6} r={9} fill="none" stroke={INK} strokeWidth={4} />
      <g transform={`translate(${d.x} ${d.y}) rotate(${r.wiggle ?? 0}) scale(1.3)`}>
        {[-1, 1].map((s) => (
          <g key={s}>
            <line x1={s * 70} y1={-4} x2={s * 120} y2={-4} stroke={INK} strokeWidth={10} strokeLinecap="round" />
            <line x1={s * 120} y1={-4} x2={s * 120} y2={-30} stroke={INK} strokeWidth={8} />
            <ellipse cx={s * 120} cy={-32} rx={prop(s)} ry={5} fill={INK} opacity={0.55} />
            <circle cx={s * 120} cy={-32} r={6} fill={INK} />
          </g>
        ))}
        <rect x={-82} y={-20} width={164} height={40} rx={18} fill={afp.purple} stroke={INK} strokeWidth={OUTLINE} />
        <circle cx={0} cy={26} r={12} fill={INK} />
        <circle cx={-4} cy={23} r={4} fill={afp.purple200} />
        <circle cx={52} cy={0} r={6} fill={led} />
      </g>
    </g>
  );
};

// Klo fra en spillautomat: to armer som lukker seg rundt toppen av flisen.
const Claw: React.FC<{ r: Rescuer }> = ({ r }) => {
  const { x, y } = r.hold;
  const a = 6 + 30 * (1 - r.grip);
  const prong = (s: number) => (
    <g transform={`translate(${x + s * 24} ${y - 84}) rotate(${s * -a})`}>
      <path d={`M 0 0 L ${s * 26} 54 L ${s * 14} 98 L ${s * -6} 108`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M 0 0 L ${s * 26} 54 L ${s * 14} 98 L ${s * -6} 108`} fill="none" stroke={afp.metal} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return (
    <g>
      <line x1={x} y1={-40} x2={x} y2={y - 110} stroke={INK} strokeWidth={12} />
      {prong(-1)}
      {prong(1)}
      <rect x={x - 40} y={y - 118} width={80} height={40} rx={10} fill={INK} stroke={INK} strokeWidth={OUTLINE} />
      <circle cx={x} cy={y - 98} r={8} fill={afp.yellow} stroke={INK} strokeWidth={2} />
    </g>
  );
};

// Hesteskomagnet i tau.
const Magnet: React.FC<{ r: Rescuer; frame: number }> = ({ r, frame }) => {
  const { x, y } = r.hold;
  const arch = `M ${x - 48} ${y - 22} L ${x - 48} ${y - 84} A 48 48 0 0 1 ${x + 48} ${y - 84} L ${x + 48} ${y - 22}`;
  const zap = r.grip > 0.5 ? 1 : 0;
  return (
    <g>
      <line x1={x} y1={-40} x2={x} y2={y - 150} stroke={INK} strokeWidth={5} />
      <path d={arch} fill="none" stroke={INK} strokeWidth={46} />
      <path d={arch} fill="none" stroke={afp.coral} strokeWidth={36} />
      {[-1, 1].map((s) => (
        <rect key={s} x={x + s * 48 - 21} y={y - 26} width={42} height={26} fill={afp.metal} stroke={INK} strokeWidth={OUTLINE} />
      ))}
      {[-1, 1].map((s) =>
        [0, 1].map((k) => (
          <path
            key={`${s}${k}`}
            d={`M ${x + s * (82 + k * 16)} ${y - 40 - k * 8} q ${s * 10} 10 0 22`}
            fill="none"
            stroke={afp.coral}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={zap * (0.5 + 0.5 * Math.sin(frame * 0.4 + k * 2))}
          />
        )),
      )}
    </g>
  );
};

// Saksløft som ruller inn langs gulvet og løfter flisen opp på plass.
const Lift: React.FC<{ r: Rescuer }> = ({ r }) => {
  const { x, y } = r.hold;
  const top = y + 16;
  const bottom = FLOOR + 4;
  const stages = 4;
  const h = Math.max(2, (bottom - top) / stages);
  const L = 250;
  const w = Math.sqrt(Math.max(L * L - h * h, 0)) / 2;
  return (
    <g>
      {Array.from({ length: stages }, (_, i) => {
        const y1 = top + i * h;
        const y2 = y1 + h;
        return (
          <g key={i}>
            <line x1={x - w} y1={y1} x2={x + w} y2={y2} stroke={INK} strokeWidth={14} strokeLinecap="round" />
            <line x1={x + w} y1={y1} x2={x - w} y2={y2} stroke={INK} strokeWidth={14} strokeLinecap="round" />
            <line x1={x - w} y1={y1} x2={x + w} y2={y2} stroke={afp.purple800} strokeWidth={8} strokeLinecap="round" />
            <line x1={x + w} y1={y1} x2={x - w} y2={y2} stroke={afp.purple800} strokeWidth={8} strokeLinecap="round" />
            <circle cx={x} cy={(y1 + y2) / 2} r={6} fill={afp.metal} stroke={INK} strokeWidth={2} />
          </g>
        );
      })}
      <rect x={x - 150} y={y} width={300} height={18} rx={4} fill={afp.yellow} stroke={INK} strokeWidth={OUTLINE} />
      <rect x={x - 160} y={bottom} width={320} height={46} rx={10} fill={afp.purple} stroke={INK} strokeWidth={OUTLINE} />
      {[-1, 1].map((s) => (
        <circle key={s} cx={x + s * 110} cy={bottom + 46} r={17} fill={INK} />
      ))}
    </g>
  );
};

export const RescuerView: React.FC<{ r: Rescuer; frame: number }> = ({ r, frame }) => {
  switch (r.kind) {
    case "hand":
      return <Hand r={r} />;
    case "arm":
      return <Arm r={r} frame={frame} />;
    case "crane":
      return <Crane r={r} />;
    case "drone":
      return <Drone r={r} frame={frame} />;
    case "claw":
      return <Claw r={r} />;
    case "magnet":
      return <Magnet r={r} frame={frame} />;
    case "lift":
      return <Lift r={r} />;
  }
};
