import { AbsoluteFill, interpolate } from "remotion";
import { bar, word } from "../beat";
import { City, cityCamera } from "../City";
import { Phrase, Phrases } from "../Phrases";
import { Taskbar, Toast, VisualStudio } from "../Screen";
import { Stage } from "../Stage";
import { night } from "../look";
import { TIMING } from "../timing";

// Intro (I.1–I.3 og det instrumentale partiet fram til V1): byen om natta i fugleperspektiv,
// neonskiltet «GREMLIN» tennes på «Gremlin gang in the building», kameraet dykker inn i
// toppetasjen på «push that code» og lander i kontoret på første trommeslag (takt 1).

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const INTRO_END = word("V1.1", 0);
const LAND = TIMING.firstDownbeat;

const T = {
  gremlin: word("I.2", 0),
  building: word("I.2", 4),
  hey: word("I.2", 5),
  dive: word("I.3", 0) - 0.1,
  // Mail fra ledelsen midt i det instrumentale partiet.
  mail: bar(3),
};

const w = (text: string, at: number, color?: string) => ({ text, at, color });
const PHRASES: Phrase[] = [
  {
    lines: [
      [w("Gremlin", T.gremlin, night.eyes), w("gang", word("I.2", 1))],
      [w("in", word("I.2", 2)), w("the", word("I.2", 3)), w("building", T.building)],
    ],
  },
  { lines: [[w("Hey!", T.hey, night.boom)]], size: 150 },
  {
    lines: [[w("Push", word("I.3", 0), night.ok)], [w("that", word("I.3", 1)), w("code", word("I.3", 2))]],
    until: LAND - 0.1,
  },
  // Tittelen slås inn på slagene når trommene kommer inn.
  {
    size: 150,
    lines: [[w("Gremlin", bar(1), night.eyes)], [w("in the", bar(1, 3))], [w("repo", bar(2))]],
    until: bar(4) - 0.2,
  },
];

const WRITTEN = [
  "// Gremlin.Core — Program.cs",
  "// Sist endret: fredag 16:59",
  "",
  "var builder = WebApplication.CreateBuilder(args);",
  "builder.Services.AddGremlin();",
  "",
];
const TYPED = [
  "// TODO: fjern før prod",
  "builder.Services.AddSingleton<IAlt, Alt>();",
  "var app = builder.Build();",
  'app.MapGet("/helse", () => "OK"); // alltid OK',
  "if (DateTime.Now.Hour > 16) throw new FredagException();",
  'var cfg = File.ReadAllText("C:\\\\Users\\\\meg\\\\cfg.txt");',
  "app.Run(); // lykke til",
];

const MAIL = { at: T.mail, until: bar(4) + 0.4 };

export const Intro: React.FC<{ t: number }> = ({ t }) => {
  const camera = cityCamera(t, T.dive, LAND);
  // Byen tones ut i skjermlyset fra vinduet, kontoret tones inn og zoomer litt tilbake.
  const glass = interpolate(t, [LAND - 0.35, LAND - 0.05], [0, 1], clamp);
  const office = interpolate(t, [LAND - 0.05, LAND + 0.15], [0, 1], clamp);
  const settle = interpolate(t, [LAND - 0.05, LAND + 0.7], [1.35, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  const pop = (a: number, b: number) => interpolate(t, [a, a + 0.1, a + 0.18, b, b + 0.15], [0, 1.15, 1, 1, 0], clamp);

  return (
    <AbsoluteFill>
      {office < 1 && (
        <>
          <City
            t={t}
            {...camera}
            sign={interpolate(t, [T.gremlin, T.gremlin + 0.35], [0, 1], clamp)}
            topFloor={interpolate(t, [T.building, T.building + 0.2], [0, 1], clamp)}
            eyes={interpolate(t, [T.hey, T.hey + 0.15], [0, 1], clamp)}
          />
          <AbsoluteFill style={{ background: night.glow, opacity: glass * 0.9 }} />
        </>
      )}
      {office > 0 && (
        <AbsoluteFill style={{ opacity: office, transform: `scale(${settle})`, transformOrigin: "62% 42%" }}>
          <Stage
            t={t}
            desktop={
              <>
                <VisualStudio t={t} from={LAND} written={WRITTEN} typed={TYPED} file="Program.cs" />
                <Taskbar active="vs" badges={{ outlook: t < MAIL.at ? "41" : "42", teams: "3", jira: "7" }} />
                <Toast t={t} {...MAIL} app="outlook" from="Outlook · Ledelsen" title="Kan dette være i prod i morgen?" body="Haster. Bare en liten endring :)" />
              </>
            }
            dev={{ sway: Math.sin(t * 9) * 2.5, vein: pop(MAIL.at + 0.3, MAIL.until) * (1 + 0.12 * Math.sin(t * 25)) }}
          />
        </AbsoluteFill>
      )}
      <Phrases t={t} phrases={PHRASES} x={60} y={110} />
    </AbsoluteFill>
  );
};
