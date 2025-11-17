export const categories = {
  Фото: "/elektronika/foto-video/tsifrovye-fotoapparaty/",
  Ноутбуки: "/elektronika/noutbuki-i-aksesuary/noutbuki/",
  Объективы: "/elektronika/foto-video/obektivy/",
  Планшеты:
    "/elektronika/planshety-el-knigi-i-aksessuary/planshetnye-kompyutery/",
} as const;

export const fotoBrands = {
  Canon: "[ck][ae]non",
  Nikon: "ni[ck][oa]n",
  Sony: "[sc]on[yi]",
  Fujifilm: "fu[jg]i(film)?\\b",
  Olympus: "ol[iy]mpus",
  Panasonic: "pana[sc]oni[ck]",
  Sigma: "[sc]igma",
  Back: "Back",
} as const;

export const laptopBrands = {
  Apple: "app?le",
  Dell: "dell?",
  Asus: "A[sc]u[sc]",
  Back: "Back",
} as const;

export const macbookRegex = {
  // prettier-ignore
  arm: "\bmac\s*book(?:\s*(?:air|pro))?[\s\S]*?\bm[1-4]\b(?:[\s\S]*?\b(\d{2})\s*\/\s*(\d+(?:tb|gb)?))?",
};

export const allBrands = { ...fotoBrands, ...laptopBrands };
