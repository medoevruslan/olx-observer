'use strict'

const puppeteer = require('puppeteer');

class Scrapper {

    cardsArray = [];

    // constructor({rootUrl = 'https://www.olx.ua/', category = '', searchQuery = '', queryId}) {
    //     this._URL = new URL(rootUrl);
    //     this._URL_CATEGORY = new URL(category + searchQuery, this._URL);
    //     this._URL_CATEGORY.searchParams.set('currency', 'UAH');
    //     this._queryId = queryId;
    // }

    constructor(rootUrl = 'https://www.olx.ua/') {
        this._URL = new URL(rootUrl);
    }

    async initBrowser() {
        this.browser = await puppeteer.launch({ headless: true, timeout: 0 })
    }

    // addTasks(list) {
    //     this.tasks = list;
    // }

    async scrap(task) {

        try {
                const pageUrl = new URL(task.category + task.searchQuery, this._URL);
                pageUrl.searchParams.set('currency', 'UAH');
                const page = await this.browser.newPage();
                await page.goto(pageUrl.href, { waitUntil: 'load' });

                let firstPage = true;

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
                                    queryId: queryId,
                                }
                            });
                    }, task.id);

                    this.cardsArray.push(cards);

                    if (forward) {
                        await Promise.all([
                            await page.click('.pagination-list a[data-testid=pagination-forward]'),
                            await page.waitForSelector('.pagination-list', { timeout: 0 }),
                        ])
                    }

                    if (firstPage) firstPage = false;
                }

                await page.close();
        } catch (err) {
            console.log('BROWSER ERROR :::::: ' + err);
            this.browser.close();
        }
        await this.browser.close();

        return this.cardsArray;
    }
}

module.exports = { Scrapper };