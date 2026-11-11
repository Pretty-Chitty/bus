import React, { ReactNode } from "react";
import { ParameterizedCanvas } from "@pretty-chitty/core";
import { Layered, Raw, Image, Pad } from "@pretty-chitty/core/ReactCanvas";
import { NAVY, PAPER } from "../consts";
import { PRINT_COLORS } from "../geometry/board";
import { station } from "../assets/icons";

/** The top of a crossing (a disc's cap): plain (white with a grey dot), a roundabout
 *  (white, dark ring, orange centre) or a train station (white round the blue station disc). */
export class CrossingFace extends ParameterizedCanvas {
  width = 128;
  height = 128;
  kind: "plain" | "roundabout" | "station" = "plain";

  protected render(): ReactNode {
    const kind = this.kind;
    return (
      <Layered>
        <Raw
          cb={(ctx, x, y, w, h) => {
            const cx = x + w / 2,
              cy = y + h / 2,
              R = w / 2;
            // white to the rim: the network's shared outline draws the edge
            ctx.fillStyle = PAPER;
            ctx.fillRect(x, y, w, h);
            if (kind === "plain") {
              ctx.fillStyle = PRINT_COLORS.dotGrey;
              ctx.beginPath();
              ctx.arc(cx, cy, R * 0.45, 0, Math.PI * 2);
              ctx.fill();
            } else if (kind === "roundabout") {
              ctx.fillStyle = NAVY;
              ctx.beginPath();
              ctx.arc(cx, cy, R * 0.42, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#ffb987";
              ctx.beginPath();
              ctx.arc(cx, cy, R * 0.32, 0, Math.PI * 2);
              ctx.fill();
            }
          }}
        />
        {kind === "station" ? (
          // the printed station disc is 0.65 of the white disc's diameter
          <Pad amount={22}>
            <Image image={station} fill />
          </Pad>
        ) : null}
      </Layered>
    );
  }
}
