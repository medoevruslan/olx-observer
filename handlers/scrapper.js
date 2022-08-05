'use strict'

const puppeteer = require('puppeteer');

class Scrapper {

    constructor(rootUrl = 'https://www.olx.ua/') {
        this._URL = new URL(rootUrl);
    }

    async initBrowser() {
        this.browser = await puppeteer.launch({ headless: true, timeout: 0 })
    }

    async closeBrowser() {
        await this.browser.close();
    }

    async scrap(task) {
        try {
                const pageUrl = new URL(task.category + task.searchQuery, this._URL);
                pageUrl.searchParams.set('currency', 'UAH');
                const page = await this.browser.newPage();
                await page.goto(pageUrl.href, { waitUntil: 'load' });

                let firstPage = true;
                const cardsArray = []

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

                    cardsArray.push(cards);

                    if (forward) {
                        await Promise.all([
                            await page.click('.pagination-list a[data-testid=pagination-forward]'),
                            await page.waitForSelector('.pagination-list', { timeout: 0 }),
                        ])
                    }

                    if (firstPage) firstPage = false;
                }

                await page.close();
                return cardsArray;
        } catch (err) {
            console.log('BROWSER ERROR :::::: ' + err);
            await this.browser.close();
        }
    }
}

module.exports = { Scrapper };