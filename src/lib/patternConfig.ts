export const RATIOS = {
  '1:1': 1,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
  '21:9': 21 / 9,
} as const;

export const RESOLUTIONS = {
  '4K (3840px)': 3840,
  '8K (7680px)': 7680,
  '16K (15360px)': 15360,
  '32K (30720px)': 30720,
  '40K (40000px)': 40000,
} as const;

export type RatioKey = keyof typeof RATIOS;
export type ResolutionKey = keyof typeof RESOLUTIONS;
