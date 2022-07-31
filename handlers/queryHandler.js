'use strict'

require('dotenv').config();
const sequelize = require('../db.sequelize');
const { getBenefitPrice } = require('./priceFilter');
const { dateToTimestamp } = require('./dateHandler');
const { Scrapper } = require('./scrapper');
const { User } = require('../models/user');
const { Card } = require('../models/card');
const { fetchRegexFromQuery, filterByRegex } = require('../handlers/regexHandler');
const { getQueriesFromDb } = require('../controller/quieryController')
 
async function scrapByQuery(query) {
    try {
        const scrapper = new Scrapper(query);
        let result = [];
        result = await scrapper.scrap();
        const flatted = result.flat();
        return flatted;
    } catch(err) {
        console.error('SCRAPPING ERROR ---- ' + err);
        return [];
    }
}

async function processQueryToDb(query) {
    let isObserved = false;
    let user = await User.findOne({ where : { chatId: query.chatId } });
    const assignedQuery = queryBuilder(query)
    if (user === null) {
        user = await User.create({ chatId: query.chatId, userName: query.userName });
        await user.createQuery(assignedQuery);
    } else {
        let srchQry = await user.getQueries(
           { where: {
                searchQuery: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('searchQuery')), 
                        'LIKE', `%${assignedQuery.searchQuery.toLowerCase()}%`) } });
        if (srchQry.length === 0) {
            await user.createQuery(assignedQuery);
        } else {
            isObserved = true;
        }
    }
    return isObserved;
}

async function addCardsToDb() {
    const queries = await getQueriesFromDb();
    await queries.forEach(async (query) => {
        const { category,  searchQuery, regexForModel, id } = query;
        const data = await scrapByQuery({category: category, searchQuery: searchQuery, queryId: id});
        const regex = fetchRegexFromQuery(query)
        let afterRegex = filterByRegex({ regex, data }, regexForModel)
        let maxPrice = query.maxPrice;
        const benefitPrices = getBenefitPrice(afterRegex, maxPrice);
        const dateConvereted = dateToTimestamp(benefitPrices);
        await saveCardsToDb(dateConvereted);
        getLog({ data, regex, afterRegex, dateConvereted, query });
    })
}

async function saveCardsToDb(cards) {
    await Card.bulkCreate(cards, {ignoreDuplicates: true});
}

function queryBuilder(query) {
    const { maxPrice, regexModelTxt, regexForModel, brand, model, regex, category } = query;
    const searchFor = `q-${brand}-${model.replace(/\s/g, '-')}`;
    return { 
        searchQuery: searchFor, 
        category: category, 
        regex: `${regex}`, 
        maxPrice: maxPrice, 
        regexModelTxt: regexModelTxt,
        regexForModel: regexForModel
     }
}

function getLog({data, regex, afterRegex, dateConvereted, query}) {
    console.log(new Date(Date.now()));
    console.log(regex.brand, regex.model, query.searchQuery);
    console.log(`before regex - ${data.length}`);
    console.log(`after regex - ${afterRegex.length}`);
    console.log(`after limit price - ${dateConvereted.length}`)
    console.log(dateConvereted);
}

module.exports = {
    scrapByQuery,
    processQueryToDb,
    addCardsToDb,
}
