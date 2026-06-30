export const theme = {
  negro:          "#1A1814",
  negroSidebar:   "#211E19",
  negroHover:     "#2A261F",
  dorado:         "#C0A36B",
  doradoTexto:    "#9A7223",
  doradoOscuro:   "#6B4F2A",
  crema:          "#FAF8F4",
  blanco:         "#FFFFFF",
  cremasuave:     "#FDFBF7",
  borde:          "#E8E1D4",
  bordeSuave:     "#EFEADF",
  texto:          "#1A1814",
  texto2:         "#2A2620",
  textoMute:      "#9A9281",
  okBg:           "#E7F0E4",
  okTx:           "#3B6D2E",
  pendBg:         "#F5EEDF",
  pendTx:         "#9A7223",
  urgBg:          "#F6E9E6",
  urgTx:          "#9E4332",
} as const;

export type ThemeKey = keyof typeof theme;
