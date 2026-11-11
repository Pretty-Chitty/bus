import { GameButton, ToggleGalleryButton } from "@pretty-chitty/core";
import { Apartment, NotInterested, Update } from "@mui/icons-material";
export { ToggleGalleryButton } from "@pretty-chitty/core";

/** Stop choosing actions this round (CA8). */
export class PassButton extends GameButton {
  override label = "Pass";
  override icon = NotInterested;
}

/** The Clock: let time move on instead of stopping it (CL5, CL7). */
export class LetTimeRunButton extends GameButton {
  override label = "Let it run";
  override icon = Update;
}

/** Opens the strip of building kinds to erect (BD3, FB1). */
export class BuildingsButton extends ToggleGalleryButton {
  override label = "Buildings";
  override icon = Apartment;
  override toggleSmallSize = 76; // three small discs, no captions
}
