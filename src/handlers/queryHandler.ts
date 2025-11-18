import { QueryDto } from "./../dto/QueryDto.ts";
import { CardViewDto } from "./../dto/CardViewDto.ts";
import { sequelize } from "../db/db.sequelize.ts";
import { filterByPrice } from "./priceFilter.ts";
import { User } from "../models/User.ts";
import { Card } from "../models/Card.ts";
import { type CardRegex, createRegex, filterByRegex } from "./regexHandler.ts";
import { getQueriesFromDb } from "../controller/queryController.ts";
import type { Walker } from "../core/Walker.js";
import type { CardsData } from "../core/types.ts";
import { logger } from "../utils/logger.ts";
import type { CreateQueryDomainDto } from "../models/Query.ts";

export async function getCards(walker: Walker) {
  const startTime = performance.now();
  const cardsData = await getCardsData(walker);
  if (!cardsData.length) {
    process.exit(1);
  }

  const result = resolveCardsData(cardsData);
  logger.info(
    `time of scrapping (browser version) is ${
      performance.now() - startTime
    } milliseconds`
  );

  return result;
}

function resolveCardsData(cardsData: CardsData[]) {
  const cardsResolved = cardsData.map((cardData) => {
    const cardsView = cardData.data.map(CardViewDto.mapToView);

    const regex = createRegex({
      regexBrand: cardData.query.regexBrand,
      regexModel: cardData.query.regexModel,
    });

    const afterRegex = filterByRegex(
      { regex, data: cardsView },
      Boolean(cardData.query.regexModel)
    );

    const cardsAfterPriceFilter = filterByPrice(
      afterRegex,
      cardData.query.maxPrice
    );

    getLog({
      data: cardsView,
      regex,
      afterRegex,
      cardsAfterPriceFilter,
      query: cardData.query,
    });

    return cardsAfterPriceFilter;
  });

  return cardsResolved;
}

async function getCardsData(walker: Walker): Promise<CardsData[]> {
  const queries = await getQueriesDto();
  if (!queries.length) {
    console.log("Query list is Empty");
    return [];
  }
  const work = queries.map(async (query) => {
    const { category, searchQuery, queryId } = query;
    const data = await walker.run(category, searchQuery, queryId);
    return { data: data.flat(), query };
  });

  return Promise.all(work);
}

export async function saveQueryToDb(query: SearchQuery) {
  let isObserved = false;
  let user = await User.findOne({ where: { chatId: query.chatId } });
  const assignedQuery = queryBuilder(query);
  if (user === null) {
    user = await User.create({
      chatId: query.chatId,
      userName: query.userName,
    });
    await user.createQuery(assignedQuery);
  } else {
    let srchQry = await user.getQueries({
      where: {
        searchQuery: sequelize.where(
          sequelize.fn("LOWER", sequelize.col("searchQuery")),
          "LIKE",
          `%${assignedQuery.searchQuery.toLowerCase()}%`
        ),
      },
    });
    if (srchQry.length === 0) {
      await user.createQuery(assignedQuery);
    } else {
      isObserved = true;
    }
  }
  return isObserved;
}

async function getQueriesDto(): Promise<QueryDto[]> {
  const queries = await getQueriesFromDb();
  return queries.map((query) => new QueryDto(query));
}

export async function saveCardsToDb(cards: CardViewDto[]) {
  const cardsPlain = cards.map((c) => c.toPlain());
  await Card.bulkCreate(cardsPlain, { ignoreDuplicates: true });
}

function queryBuilder(query: SearchQuery): CreateQueryDomainDto {
  const {
    maxPrice,
    regexBrand,
    regexModel,
    brand,
    model,
    isRegexModel,
    category,
  } = query;
  const searchQuery = `q-${brand}-${model.replace(/\s/g, "-")}`;
  return {
    searchQuery,
    category,
    regexBrand: `${regexBrand}`,
    maxPrice,
    regexModel,
    isRegexModel,
  };
}

function getLog({
  data,
  regex,
  afterRegex,
  cardsAfterPriceFilter,
  query,
}: {
  data: CardViewDto[];
  regex: CardRegex;
  afterRegex: CardViewDto[];
  cardsAfterPriceFilter: CardViewDto[];
  query: QueryDto;
}) {
  logger.info(new Date());
  logger.info(regex.brand, regex.model, query.searchQuery);
  logger.info(`before regex - ${data.length}`);
  logger.info(`after regex - ${afterRegex.length}`);
  logger.info(`after limit price - ${cardsAfterPriceFilter.length}`);
  logger.info(cardsAfterPriceFilter);
}

export type SearchQuery = {
  chatId: string;
  userName: string;
  category: string;
  brand: string;
  model: string;
  maxPrice: number;
  regexBrand: string;
  regexModel: string | undefined;
  isRegexModel: boolean;
};
