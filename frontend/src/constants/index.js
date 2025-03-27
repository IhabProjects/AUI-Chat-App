export const THEMES = {
  // Professional themes for academic and business use
  professional: [
    "light",
    "dark",
    "corporate",
    "business",
    "luxury",
    "wireframe",
    "nord",
    "dim"
  ],
  // Campus-inspired themes matching AUI's environment
  campus: [
    "emerald",
    "forest",
    "garden",
    "aqua",
    "pastel",
    "cupcake",
    "bumblebee",
    "lofi"
  ],
  // Creative and fun themes for student life
  creative: [
    "synthwave",
    "retro",
    "cyberpunk",
    "fantasy",
    "dracula",
    "acid",
    "lemonade",
    "cmyk"
  ],
  // Seasonal themes matching AUI's climate
  seasonal: [
    "autumn",
    "winter",
    "sunset",
    "coffee",
    "night",
    "valentine",
    "halloween",
    "black"
  ]
};

// Flatten the themes for backward compatibility
export const FLATTENED_THEMES = Object.values(THEMES).flat();
