import React, { useEffect, useRef, useState } from "react";
import { DropdownChit, ImageSpec } from "@pretty-chitty/core";
import type { Root } from "./Root";
import type { Player } from "./Player";
import { ACTIONS, ACTION_IDS, ActionId, BUILDING_NAME, LETTERS, PLAYER_COLORS, nextClock } from "../consts";
import { actionPower, busesOf, clockKind, deliverable, finalStandings, legalBuildingLocations, maxBuses, openZone } from "../rules";
import { ACTION_PICTURE } from "./ActionSpace";
import { house, office, pub } from "../assets/buildings";
import { passengers as passengerIcon } from "../assets/icons";

const KIND_ICON = { house, office, pub };

/** The rulebook's reference sheet, made live: every number through the rules' own functions. */
export class PlayerAid extends DropdownChit {
  round = 0;

  renderLabel() {
    return this.round ? `Round ${this.round}` : "Bus";
  }
  renderBody(playerId?: string) {
    return <AidBody aid={this} playerId={playerId} />;
  }
}

function Icon({ image, h = 18, title }: { image: ImageSpec; h?: number; title?: string }) {
  const b = image.primary.bounds;
  const s = h / b.height;
  return (
    <span className="aid-ic" title={title} style={{ width: Math.round(b.width * s), height: h }}>
      <img src={image.primary.file} alt={title ?? ""} style={{ left: -b.x * s, top: -b.y * s, transform: `scale(${s})` }} />
    </span>
  );
}

interface Facts {
  ready: boolean;
  round: number;
  m: number;
  clock: string;
  next: string;
  stones: number;
  supply: number;
  zone: number;
  free: number;
  five: boolean;
  spaces: { action: ActionId; letter: string; power: number; taken?: string }[];
  me?: { name: string; buses: number; markers: number; carryIfTurns: number; carryIfStops: number; route: number };
  standings: { name: string; hex: string; score: number; stones: number; net: number; markers: number }[];
  playersWithMarkers: number;
}

function facts(root: Root | undefined, playerId?: string): Facts {
  const empty: Facts = { ready: false, round: 0, m: 0, clock: "", next: "", stones: 0, supply: 0, zone: 0, free: 0, five: false, spaces: [], standings: [], playersWithMarkers: 0 };
  try {
    const board = root?.mainBoard;
    if (!root || !board || board.actionSpaces.length === 0 || board.roads.crossings.length === 0) return empty;
    const players = root.players.copy() as Player[];
    const me = players.find((p) => p.playerId === playerId);
    const k = clockKind(root);
    const spaces = ACTION_IDS.flatMap((a) =>
      board.spacesOf(a).map((s) => {
        const owner = s.marker ? players.find((p) => p.colorIndex === s.marker!.colorIndex) : undefined;
        return { action: a, letter: s.letter, power: actionPower(root, s), taken: owner ? PLAYER_COLORS[owner.colorIndex].hex : undefined };
      }),
    );
    const { rows } = finalStandings(root);
    return {
      ready: true,
      round: root.round,
      m: maxBuses(root),
      clock: k,
      next: nextClock(k),
      stones: board.stoneSpaces.filter((x) => !!x.stone).length,
      supply: board.supply,
      zone: openZone(root),
      free: legalBuildingLocations(root).length,
      five: players.length === 5,
      spaces,
      me: me && {
        name: me.name,
        buses: busesOf(root, me),
        markers: me.markers.length,
        carryIfTurns: deliverable(root, me, nextClock(k)),
        carryIfStops: deliverable(root, me, k),
        route: Math.max(0, me.route.length - 1),
      },
      standings: rows.map((r) => ({ name: r.p.name, hex: r.p.hex, score: r.p.score, stones: r.stones, net: r.net, markers: r.p.markers.length })),
      playersWithMarkers: players.filter((p) => p.markers.length > 0).length,
    };
  } catch {
    return empty;
  }
}

function AidBody({ aid, playerId }: { aid: PlayerAid; playerId?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [json, setJson] = useState(() => JSON.stringify(facts(aid.parent as Root, playerId)));
  useEffect(() => {
    // the aid redraws only when its own chit changes: while open, re-read the table
    const t = setInterval(() => {
      if ((box.current?.getBoundingClientRect().bottom ?? 0) <= 0) return;
      setJson(JSON.stringify(facts(aid.parent as Root, playerId)));
    }, 300);
    return () => clearInterval(t);
  }, [aid, playerId]);
  const f: Facts = JSON.parse(json);
  const kindIcon = (k: string) => <Icon image={KIND_ICON[k as keyof typeof KIND_ICON]} title={k} />;

  const row = (a: ActionId) => {
    const def = ACTIONS[a];
    const sp = f.spaces.filter((s) => s.action === a);
    const order = def.order === "lastChosen" ? "F → A: the first to choose it goes last" : def.order === "firstChosen" ? "A first" : "one player";
    return (
      <tr key={a}>
        <td className="aid-name">
          <Icon image={ACTION_PICTURE[a]} h={22} /> {def.name}
        </td>
        <td>
          {def.dwindles ? (
            <span className="aid-chips">
              {sp.map((s) => (
                <span key={s.letter} className="aid-chip" style={s.taken ? { borderColor: s.taken, boxShadow: `inset 0 0 0 2px ${s.taken}` } : {}}>
                  {s.letter} {Math.max(0, s.power)}
                </span>
              ))}
            </span>
          ) : (
            <span className="aid-dim">{def.multi ? "A–F" : "1 space"}</span>
          )}
        </td>
        <td className="aid-help">
          {def.short}. <span className="aid-dim">{order}.</span>
        </td>
      </tr>
    );
  };

  return (
    <div className="aid" ref={box}>
      <style>{CSS}</style>
      <div className="aid-grid">
        <section className="aid-card aid-now">
          <h3>Right now</h3>
          {!f.ready ? (
            <p className="aid-dim">The table is being set up.</p>
          ) : (
            <>
              <p>
                Most buses anyone owns: <b>{f.m}</b>. Space A does that many, B one fewer, and so on{f.five ? " (5 players: Line Expansion adds one more)" : ""}.
              </p>
              <p>
                Clock: {kindIcon(f.clock)} <b>{BUILDING_NAME[f.clock as "house"]}</b>, next {kindIcon(f.next)} {BUILDING_NAME[f.next as "house"]}.{" "}
                Time stones left: <b>{f.stones}</b>.
              </p>
              <p>
                <Icon image={passengerIcon} /> in the supply: <b>{f.supply}</b>. Buildings: zone <b>{f.zone || "—"}</b> is open, <b>{f.free}</b> free{" "}
                {f.free === 1 ? "location" : "locations"} in it.
              </p>
              {f.me && (
                <p>
                  You: <b>{f.me.buses}</b> {f.me.buses === 1 ? "bus" : "buses"}, <b>{f.me.markers}</b> action markers left, a line of <b>{f.me.route}</b>{" "}
                  {f.me.route === 1 ? "street" : "streets"}. A Vrrooomm! now could carry <b>{f.me.carryIfTurns}</b> if the clock moves on, <b>{f.me.carryIfStops}</b> if time is
                  stopped.
                </p>
              )}
            </>
          )}
        </section>

        <section className="aid-card aid-score">
          <h3>If the game ended now</h3>
          <table>
            <tbody>
              {f.standings.map((s, i) => (
                <tr key={s.name}>
                  <td>{i + 1}.</td>
                  <td>
                    <span className="aid-dot" style={{ background: s.hex }} /> {s.name}
                  </td>
                  <td className="aid-num">{s.score}</td>
                  <td className="aid-num aid-dim">− {s.stones}</td>
                  <td className="aid-num">
                    <b>{s.net}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="aid-dim aid-why">Points minus time stones. Ties: most time stones, then whoever reached the score first.</p>
        </section>

        <section className="aid-card aid-turn">
          <h3>A round</h3>
          <p className="aid-steps">
            <span>
              <b>1</b> In turn, place action markers on actions: at least two each, then pass when you like.
            </span>
            <span>
              <b>2</b> The actions resolve from top to bottom.
            </span>
            <span>
              <b>3</b> Spent markers leave the game; the start-bus holder begins the next round.
            </span>
          </p>
          <table className="aid-actions">
            <tbody>{ACTION_IDS.map(row)}</tbody>
          </table>
        </section>

        <section className="aid-card aid-end">
          <h3>The game ends</h3>
          <p>
            <b>At once</b>, when the last time stone is taken ({f.stones} left).
          </p>
          <p>
            <b>After the round</b>, when every building location is built ({f.free} free in zone {f.zone || "—"}), or when at most one player still has action markers (
            {f.playersWithMarkers} do).
          </p>
        </section>

        <section className="aid-card aid-how">
          <h3>How things move</h3>
          <p>
            <b>Passengers</b> want to be in the kind of building the clock shows. At the Clock step, any whose building no longer matches step out onto their crossing; anyone at a crossing
            with a free building of that kind steps in. Those left standing want to get away.
          </p>
          <p>
            <b>Vrrooomm!</b> Each bus carries one waiting passenger from a crossing on your line to a free building of that kind on your line: 1 point each. Carry as many as you can.
          </p>
          <p>
            <b>Your line</b> grows from either end onto an empty street, if that end has one. With none, run alongside another line; where your end meets another player's end, you may
            run alongside theirs for one street. Never alongside your own.
          </p>
        </section>
      </div>
    </div>
  );
}

const CSS = `
.aid{container-type:inline-size;font-family:Poppins,Quicksand,sans-serif;color:#1c1c2c;font-size:14px;line-height:1.35}
.aid-grid{display:grid;gap:10px;grid-template-columns:1fr}
@container (min-width:760px){.aid-grid{grid-template-columns:1.1fr 1fr}.aid-turn{grid-column:1/-1}}
@container (min-width:1080px){.aid-grid{grid-template-columns:1.2fr .9fr .9fr}.aid-turn{grid-column:1/3}}
.aid-card{background:#f7f4eb;border-radius:10px;padding:10px 12px;border:2px solid #1c1c2c}
.aid-card h3{margin:0 0 6px;font-size:15px;font-weight:700;color:#163a52}
.aid-card p{margin:0 0 6px}
.aid-dim{opacity:.7}
.aid-ic{display:inline-block;position:relative;overflow:hidden;vertical-align:-.25em}
.aid-ic img{position:absolute;max-width:none;width:auto;height:auto;transform-origin:0 0;display:block}
.aid-chips{display:inline-flex;flex-wrap:wrap;gap:3px}
.aid-chip{display:inline-block;min-width:30px;padding:1px 5px;border-radius:9px;background:#1c1c2c;color:#fff;font-size:12px;text-align:center;border:2px solid #1c1c2c}
.aid-dot{display:inline-block;width:11px;height:11px;border-radius:50%;vertical-align:-1px;border:1px solid rgba(0,0,0,.35)}
.aid table{border-collapse:collapse;width:100%}
.aid td{padding:2px 4px;vertical-align:middle}
.aid-num{text-align:right;white-space:nowrap}
.aid-name{white-space:nowrap;font-weight:600}
.aid-actions td{border-top:1px solid rgba(28,28,44,.15)}
.aid-steps{display:flex;flex-wrap:wrap;gap:4px 12px}
.aid-steps b{display:inline-block;background:#eb008c;color:#fff;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:12px;margin-right:3px}
@container (max-width:520px){.aid-why{display:none}.aid-help .aid-dim{display:none}}
`;
