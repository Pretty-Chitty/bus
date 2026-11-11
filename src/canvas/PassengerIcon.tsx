import React, { ReactNode } from "react";
import { ParameterizedCanvas } from "@pretty-chitty/core";
import { Raw } from "@pretty-chitty/core/ReactCanvas";
import { PASSENGER_ASPECT, PASSENGER_COLOR, PASSENGER_OUTLINE } from "../geometry/shapes";

/** The wooden passenger's figure (traced from the board's icon), for the passenger-supply spark. */
export class PassengerIcon extends ParameterizedCanvas {
  width = 64;
  height = 64;

  protected render(): ReactNode {
    return (
      <Raw
        cb={(ctx, x, y, w, h) => {
          const H = h * 0.86;
          const W = H * PASSENGER_ASPECT;
          const ox = x + (w - W) / 2;
          const oy = y + (h - H) / 2;
          ctx.beginPath();
          PASSENGER_OUTLINE.forEach(([px, py], i) => (i ? ctx.lineTo(ox + px * H, oy + py * H) : ctx.moveTo(ox + px * H, oy + py * H)));
          ctx.closePath();
          ctx.fillStyle = PASSENGER_COLOR;
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.55)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }}
      />
    );
  }
}
