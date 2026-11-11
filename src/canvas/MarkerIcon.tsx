import React, { ReactNode } from "react";
import { ParameterizedCanvas } from "@pretty-chitty/core";
import { Raw } from "@pretty-chitty/core/ReactCanvas";

/** An action marker seen from above, for the markers spark. */
export class MarkerIcon extends ParameterizedCanvas {
  width = 64;
  height = 64;
  hex = "#888888";

  protected render(): ReactNode {
    const hex = this.hex;
    return (
      <Raw
        cb={(ctx, x, y, w, h) => {
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h * 0.62, w * 0.36, h * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = hex;
          ctx.fillRect(x + w * 0.16, y + h * 0.3, w * 0.68, h * 0.32);
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h * 0.62, w * 0.34, h * 0.16, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h * 0.3, w * 0.34, h * 0.16, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.4)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }}
      />
    );
  }
}
