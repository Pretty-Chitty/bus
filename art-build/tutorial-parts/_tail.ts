  for (const s of steps) {
    if (pins.steps[s.id]) s.rng = pins.steps[s.id];
    const ai = pins.ai[s.id];
    if (ai) s.ai = Object.fromEntries(Object.entries(ai).map(([id, moves]) => [id, forced(moves)]));
  }
  return defineTutorial<Player, Root>({
    id: "tutorial",
    locale: t.locale,
    title: t.title,
    intro: t.intro,
    theme: { highlightColor: "#9dff3a", highlightGlow: "#9dff3a", arrowColor: "#9dff3a", boxBackground: "#0f2b3cf2", boxTextColor: "#ffffff", accent: "#f5c518" },
    match: {
      players: [{ name: t.you }, { name: "Mila", ai: {} }, { name: "Bram", ai: {} }],
      // The seating shuffle (zeros keep the order), then the deal: the first draw picks the starting player (you)
      rng: pins.setup.length ? pins.setup : [[0, 0, 0, 0, 0, 0], 0],
      ai: { seed: 7, thinkMs: 700 },
    },
    steps,
  });
}

export function buildTutorial(locale: string, pins: Pins): TutorialSpec<Player, Root> {
  void locale; // one locale so far
  return intro(en, pins);
}

export const tutorials: TutorialSpec<Player, Root>[] = [buildTutorial("en", pinsJson as Pins)];
