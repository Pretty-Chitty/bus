import React, { ReactNode } from "react";
import { ParameterizedCanvas } from "@pretty-chitty/core";
import { Layered, Raw, Text } from "@pretty-chitty/core/ReactCanvas";
import { NAVY } from "../consts";
import { PRINT_COLORS } from "../geometry/board";
import { POPPINS } from "./fonts";

/** A building location as printed: a navy disc with its zone number in the zone's colour. */
export class LocationFace extends ParameterizedCanvas {
  width = 128;
  height = 128;
  zone: 1 | 2 | 3 | 4 = 1;

  protected render(): ReactNode {
    const colour = (PRINT_COLORS.numeral as Record<string, string>)[String(this.zone)];
    return (
      <Layered>
        <Raw
          cb={(ctx, x, y, w, h) => {
            ctx.fillStyle = NAVY;
            ctx.fillRect(x, y, w, h);
          }}
        />
        <Text fontSize={84} fontFamily={POPPINS} fontWeight={700} fill={colour} align="center" offsetY={3}>
          {String(this.zone)}
        </Text>
      </Layered>
    );
  }
}
