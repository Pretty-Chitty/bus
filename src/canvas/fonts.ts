// The board's lettering is a geometric sans (Poppins, as in the rulebook). Start loading at module load:
// canvas text is drawn once and cached, and does not wait for web fonts.
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
if (typeof document !== "undefined") {
  void document.fonts?.load("700 32px Poppins");
  void document.fonts?.load("600 32px Poppins");
}
export const POPPINS = "Poppins";
