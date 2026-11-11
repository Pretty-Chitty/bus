  const steps: Step[] = [
    // ------------------------------------------------------------------ the goal and the city
    narrate("welcome", { box: { anchor: "center" }, focus: [{ ring: board, reveal: true }] }),
    narrate("goal", { focus: [{ arrow: { ui: (_root: Root, me: Player) => `spark:${me.scoreSpark.id}` } }] }),
    narrate(
      "map",
      beats("map", [
        ["", [{ ring: (root) => root.mainBoard.roads.streets.copy() }]],
        ["crossings", [{ ring: (root) => root.mainBoard.roads.crossings.copy(), separate: true, zoom: false }]],
      ]),
    ),
    narrate(
      "locations",
      beats("locations", [
        ["", [{ ring: zone1, separate: true, dim: true }]],
        ["thin line", [{ ring: loc("L101"), arrow: true }, { ring: crossing("X09") }]],
        ["zone 2", [{ ring: (root) => root.mainBoard.locations.filter((l) => l.zone === 2), separate: true, dim: true, zoom: false }]],
      ]),
    ),
    narrate(
      "clock",
      beats("clock", [
        ["", [{ ring: clockHand, arrow: true }]],
        ["moves on", [{ ring: clockHand, arrow: true }]],
      ]),
    ),
    narrate(
      "passengers",
      beats("passengers", [
        ["", [{ ring: (root) => roundabouts(root).flatMap((c) => c.passengers.copy()), separate: true, arrow: true, dim: true }]],
        ["supply", [{ ring: supply, arrow: true }]],
        ["train", [{ ring: stations, separate: true, arrow: true }]],
      ]),
    ),
    narrate(
      "tray",
      beats("tray", [
        ["", [{ ring: myMarkers, arrow: true }]],
        ["depot", [{ ring: myBuses, arrow: true }]],
        ["start-bus", [{ ring: startBus, arrow: true }]],
      ]),
    ),

    // ------------------------------------------------------------------ the first buildings (FB)
    narrate(
      "fb-intro",
      beats("fb-intro", [
        ["", [{ ring: zone1, separate: true }]],
        ["supply", [{ ring: (root) => root.mainBoard.staging.stacks(), separate: true, arrow: true }]],
      ]),
    ),
    doIt("fb-office", { key: "setup.building", chit: stackTop("office"), target: loc("L101") }, built("L101", "office"), {
      focus: [{ ring: stackTop("office"), arrow: true }, { ring: loc("L101"), arrow: true }],
    }),
    doIt("fb-house", { key: "setup.building", chit: stackTop("house"), target: loc("L104") }, built("L104", "house"), {
      focus: [{ ring: stackTop("house"), arrow: true }, { ring: loc("L104"), arrow: true }],
    }),
    confirm("fb-confirm"),
    watch("others-fb-mila", "p1", builtCount(4), { focus: [{ ring: zone1, separate: true }] }),
    watch("others-fb-bram", "p2", builtCount(6), { focus: [{ ring: zone1, separate: true }] }),

    // ------------------------------------------------------------------ the first lines (FL)
    narrate("fl-intro", { focus: [{ ring: nextLine, arrow: true }] }),
    doIt("fl-first", { key: "setup.line", chit: nextLine, target: street("S21") }, onStreet("S21"), {
      focus: [{ ring: nextLine, arrow: true }, { ring: street("S21"), arrow: true }],
    }),
    confirm("fl-confirm"),
    watch("others-fl-mila", "p1", linesLaid(2), { focus: [{ ring: milaLine }] }),
    watch("others-fl-bram", "p2", linesLaid(3), { focus: [{ ring: bramLine }] }),
    narrate("fl-reverse", { focus: [{ ring: myLine, arrow: true }] }),
    watch("others-fl2-bram", "p2", linesLaid(4), { focus: [{ ring: bramLine }] }),
    watch("others-fl2-mila", "p1", linesLaid(5), { focus: [{ ring: milaLine }] }),
    doIt("fl-second", { key: "setup.line2", chit: nextLine, target: street("S20") }, onStreet("S20"), {
      focus: [{ ring: nextLine, arrow: true }, { ring: street("S20"), arrow: true }],
    }),
    narrate("finish", { box: { anchor: "center" }, end: "continue" }),
  ];
