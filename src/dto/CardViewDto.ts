import type { CardsResult } from "./../core/types.ts";
import { dateParser } from "../handlers/dateHandler.ts";

export class CardViewDto {
  name: string = "";
  price: number = 0;
  link: string = "";
  time: number = 0;
  queryId: number = 0;

  public static mapToView(card: CardsResult): CardViewDto {
    const dto = new CardViewDto();

    dto.link = card.link;
    dto.price = CardViewDto.parsePrice(card.price);
    dto.name = card.name;
    dto.time = dateParser(card.time);
    dto.queryId = card.queryId;

    return dto;
  }

  private static parsePrice(price: string | number): number {
    if (typeof price === "number") return price;
    if (!price) return 0;

    const clean = price.replace(/[^\d]/g, "");
    return Number.parseInt(clean, 10) || 0;
  }
}
