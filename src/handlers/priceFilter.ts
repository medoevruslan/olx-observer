import { CardViewDto } from "../dto/CardViewDto.ts";

function sortPrice(data: CardViewDto[], ascending = true) {
  const sorted = data.toSorted((a, b) => {
    return ascending ? a.price - b.price : a.price - b.price;
  });
  return sorted;
}

export function filterByPrice(cards: CardViewDto[], maxPrice: number) {
  const sorted = sortPrice(cards);

  return sorted.filter(
    (el) => maxPrice >= el.price && el.price >= maxPrice - maxPrice * 0.7
  );
}
