import React, { ReactNode } from "react";
import { ParameterizedCanvas } from "@pretty-chitty/core";
import { Raw } from "@pretty-chitty/core/ReactCanvas";

/** A bus token from the side, in the player's colour, for the buses spark. */
export class BusIcon extends ParameterizedCanvas {
  width = 64;
  height = 64;
  hex = "#888888";

  protected render(): ReactNode {
    const hex = this.hex;
    return (
      <Raw
        cb={(ctx, x, y, w, h) => {
          const bx = x + w * 0.08,
            by = y + h * 0.28,
            bw = w * 0.84,
            bh = h * 0.4,
            r = h * 0.08;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, r);
          ctx.fillStyle = hex;
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.45)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          for (let i = 0; i < 4; i++) ctx.fillRect(bx + bw * (0.08 + i * 0.22), by + bh * 0.18, bw * 0.16, bh * 0.32);
          ctx.fillStyle = "#1c1c2c";
          for (const cx of [bx + bw * 0.24, bx + bw * 0.76]) {
            ctx.beginPath();
            ctx.arc(cx, by + bh, h * 0.08, 0, Math.PI * 2);
            ctx.fill();
          }
        }}
      />
    );
  }
}
