import { QueryDto } from "../dto/QueryDto.ts";

export type CardsResult = {
  name: string;
  price: string;
  link: string;
  time: string | undefined;
  queryId: number;
};

export type CardsData = {
  data: CardsResult[];
  query: QueryDto;
};
