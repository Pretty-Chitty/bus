import React, { ReactNode } from "react";
import { ParameterizedCanvas } from "@pretty-chitty/core";
import { Layered, Raw, Text, Horizontal, Spacer } from "@pretty-chitty/core/ReactCanvas";
import { NAVY, PAPER } from "../consts";
import { POPPINS } from "./fonts";

/** Texels per world unit on road faces. */
export const ROAD_TEXELS = 150;

/** The top of a road's raised white band, with the street's name in the board's lettering, centred on the
 *  part of the road between the two crossing discs (`padL`/`padR`, units). */
export class StreetFace extends ParameterizedCanvas {
  width = 300;
  height = 63;
  name = "Street";
  padL = 0;
  padR = 0;

  protected render(): ReactNode {
    return (
      <Layered>
        <Raw
          cb={(ctx, x, y, w, h) => {
            ctx.fillStyle = PAPER;
            ctx.fillRect(x, y, w, h);
          }}
        />
        <Horizontal>
          <Spacer size={this.padL * ROAD_TEXELS} />
          <Text
            fontSize={Math.round(this.height * 0.44)}
            fontFamily={POPPINS}
            fontWeight={700}
            fill={NAVY}
            align="center"
          >
            {this.name.toUpperCase()}
          </Text>
          <Spacer size={this.padR * ROAD_TEXELS} />
        </Horizontal>
      </Layered>
    );
  }
}
