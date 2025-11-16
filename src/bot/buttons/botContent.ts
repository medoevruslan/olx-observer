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

export const allBrands = { ...fotoBrands, ...laptopBrands };

export const yesNo = ["Да", "Нет"] as const;
export const options = ["Мои запросы"] as const;

export const startBtn = {
  search: "Создать новый поиск",
  options: "Журнал существующих запросов",
} as const;
