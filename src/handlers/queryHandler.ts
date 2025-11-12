import { CardViewDto } from "./../dto/CardViewDto.ts";
import "dotenv/config";
import { sequelize } from "../db/db.sequelize.ts";
import { filterByPrice } from "./priceFilter.ts";
import { Scrapper } from "./scrapper.ts";
import { User } from "../models/User.ts";
import { Card } from "../models/Card.ts";
import { type CardRegex, createRegex, filterByRegex } from "./regexHandler.ts";
import { getQueriesFromDb } from "../controller/queryController.ts";
import { QueryDto } from "../dto/QueryDto.ts";
import type { Walker } from "../core/Walker.js";
import type { CardsData } from "../core/types.ts";
import { logger } from "../utils/logger.ts";

export async function scrapByQuery({
  category,
  searchQuery,
  queryId,
}: {
  category: string;
  searchQuery: string;
  queryId: number;
}) {
  const scrapper = new Scrapper({ category, searchQuery, queryId });
  let result = [];
  result = await scrapper.scrap();
  const flatted = result.flat();
  return flatted;
}

export async function launch(walker: Walker) {
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
}

function resolveCardsData(cardsData: CardsData[]) {
  const cardsResolved = cardsData.map((cardData) => {
    const cardsView = cardData.data.map(CardViewDto.mapToView);

    const regex = createRegex({
      regex: cardData.query.regex,
      regexModelTxt: cardData.query.regexModelTxt,
    });

    const afterRegex = filterByRegex(
      { regex, data: cardsView },
      Boolean(cardData.query.regexForModel)
    );

    const afterPriceFilter = filterByPrice(afterRegex, cardData.query.maxPrice);

    getLog({
      data: cardsView,
      regex,
      afterRegex,
      afterPriceFilter,
      query: cardData.query,
    });

    return afterPriceFilter;
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
    walker.initQuery(category, searchQuery, queryId);
    const data = await walker.execute();
    return { data: data.flat(), query };
  });

  const result = await Promise.all(work);
  return result;
}

export async function processQueryToDb(query: any) {
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

// export async function addCardsToDb() {
//   const startTime = performance.now();
//   const queries = await getQueriesDto();
//   for await (let query of queries) {
//     const { category, searchQuery, regexForModel, queryId, maxPrice } = query;
//     const data = await scrapByQuery({ category, searchQuery, queryId });
//     const regex = createRegex(query);
//     const afterRegex = filterByRegex({ regex, data }, regexForModel);
//     const benefitPrices = filterByPrice(afterRegex, maxPrice);
//     const dateConvereted = dateToTimestamp(benefitPrices);
//     await saveCardsToDb(dateConvereted);
//     getLog({ data, regex, afterRegex, dateConvereted, query });
//   }
//   console.log(
//     `time of scrapping (browser version) is ${
//       performance.now() - startTime
//     } milliseconds`
//   );
// }

async function saveCardsToDb(cards) {
  await Card.bulkCreate(cards, { ignoreDuplicates: true });
}

function queryBuilder(query) {
  const {
    maxPrice,
    regexModelTxt,
    regexForModel,
    brand,
    model,
    regex,
    category,
  } = query;
  const searchFor = `q-${brand}-${model.replace(/\s/g, "-")}`;
  return {
    searchQuery: searchFor,
    category: category,
    regex: `${regex}`,
    maxPrice: maxPrice,
    regexModelTxt: regexModelTxt,
    regexForModel: regexForModel,
  };
}

function getLog({
  data,
  regex,
  afterRegex,
  afterPriceFilter,
  query,
}: {
  data: CardViewDto[];
  regex: CardRegex;
  afterRegex: CardViewDto[];
  afterPriceFilter: CardViewDto[];
  query: QueryDto;
}) {
  logger.info(new Date());
  logger.info(regex.brand, regex.model, query.searchQuery);
  logger.info(`before regex - ${data.length}`);
  logger.info(`after regex - ${afterRegex.length}`);
  logger.info(`after limit price - ${afterPriceFilter.length}`);
  logger.info(afterPriceFilter);
}
