'use strict'

require('dotenv').config();
const sequelize = require('../db.sequelize');
const { getBenefitPrice } = require('./priceFilter');
const { dateToTimestamp } = require('./dateHandler');
const { User } = require('../models/user');
const { Card } = require('../models/card');
const { fetchRegexFromQuery, filterByRegex } = require('../handlers/regexHandler');
const { getQueriesFromDb } = require('../controller/queryController');
const QueryDto = require('../dtos/QueryDto');
const { Cluster } = require('puppeteer-cluster')
 
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

async function getQueriesDto() {
    const queries = await getQueriesFromDb();
    return queries.map(query => new QueryDto(query));
}

async function addCardsToDb() {
    const queries = await getQueriesDto();
    const baseUrl = new URL('https://www.olx.ua/');

    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 5,
    })

    await cluster.task( async({ page, data: query }) => {
        const pageUrl = new URL(query.category + query.searchQuery, baseUrl);
        pageUrl.searchParams.set('currency', 'UAH');
        await page.goto(pageUrl.href);

        let firstPage = true;
        const cardsArray = []

        try {
            while (true) {
                const forward = await page.$('.pagination-list a[data-testid=pagination-forward]');
                if (!forward && !firstPage) break;
                const cards = await page.evaluate((queryId) => {
                    return [...document.querySelectorAll('div[data-cy=l-card]')]
                        .map(el => {
                            return {
                                name: el.querySelector('h6').textContent,
                                price: el.querySelector('h6').nextElementSibling.textContent,
                                link: 'olx.ua' + el.querySelector('a').getAttribute('href'),
                                time: el.querySelector('p[data-testid=location-date]').textContent.split(' - ')[1],
                                queryId
                            }
                        });
                }, query.id);
    
                cardsArray.push(cards);
    
                if (forward) {
                    await Promise.all([
                        await page.click('.pagination-list a[data-testid=pagination-forward]'),
                        await page.waitForSelector('.pagination-list', { timeout: 0 }),
                    ])
                }
    
                if (firstPage) firstPage = false;
            }

            const { maxPrice, regexForModel } = query;
            const data = cardsArray.flat();
            const regex = fetchRegexFromQuery(query);
            let afterRegex = filterByRegex({ regex, data }, regexForModel);
            const benefitPrices = getBenefitPrice(afterRegex, maxPrice);
            const dateConvereted = dateToTimestamp(benefitPrices);
            await saveCardsToDb(dateConvereted)
            getLog({ data, regex, afterRegex, dateConvereted, query });

        } catch (err) {
            console.log(err);
        }
    })

    queries.forEach(async query => {
        cluster.queue(query);
    })

    await cluster.idle();
    await cluster.close();
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
    addCardsToDb,
    processQueryToDb,
}
