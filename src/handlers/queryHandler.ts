import "dotenv/config";
import { sequelize } from "../db/db.sequelize.ts";
import { getBenefitPrice } from "./priceFilter.ts";
import { dateToTimestamp } from "./dateHandler.ts";
import { Scrapper } from "./scrapper.ts";
import { User } from "../models/User.ts";
import { Card } from "../models/Card.ts";
import { createRegex, filterByRegex } from "./regexHandler.ts";
import { getQueriesFromDb } from "../controller/queryController.ts";
import { QueryDto } from "../dtos/QueryDto.ts";
import type { Walker } from "../core/Walker.js";

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
  const cardsData = await getCardsData(walker);
  if (!cardsData.length) {
    process.exit(1);
  }

  const regex = createRegex(query);
  const afterRegex = filterByRegex({ regex, data }, regexForModel);
  const benefitPrices = getBenefitPrice(afterRegex, maxPrice);
  const dateConvereted = dateToTimestamp(benefitPrices);
}

async function getCardsData(walker: Walker) {
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

export async function addCardsToDb() {
  const startTime = performance.now();
  const queries = await getQueriesDto();
  for await (let query of queries) {
    const { category, searchQuery, regexForModel, queryId, maxPrice } = query;
    const data = await scrapByQuery({ category, searchQuery, queryId });
    const regex = createRegex(query);
    const afterRegex = filterByRegex({ regex, data }, regexForModel);
    const benefitPrices = getBenefitPrice(afterRegex, maxPrice);
    const dateConvereted = dateToTimestamp(benefitPrices);
    await saveCardsToDb(dateConvereted);
    getLog({ data, regex, afterRegex, dateConvereted, query });
  }
  console.log(
    `time of scrapping (browser version) is ${
      performance.now() - startTime
    } milliseconds`
  );
}

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

function getLog({ data, regex, afterRegex, dateConvereted, query }) {
  console.log(new Date(Date.now()));
  console.log(regex.brand, regex.model, query.searchQuery);
  console.log(`before regex - ${data.length}`);
  console.log(`after regex - ${afterRegex.length}`);
  console.log(`after limit price - ${dateConvereted.length}`);
  console.log(dateConvereted);
}
