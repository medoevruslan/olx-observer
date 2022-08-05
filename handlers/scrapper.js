'use strict'

const puppeteer = require('puppeteer');

class Scrapper {

    constructor({rootUrl = 'https://www.olx.ua/', category = '', searchQuery = '', queryId}) {
        this._URL = new URL(rootUrl);
        this._URL_CATEGORY = new URL(category + searchQuery, this._URL);
        this._URL_CATEGORY.searchParams.set('currency', 'UAH');
        this._queryId = queryId;
    }

    async scrap() {
        let browser = null;
        try {
            browser = await puppeteer.launch({headless: true, timeout: 0});
            const page = await browser.newPage();
            await page.goto(this._URL_CATEGORY.href, {waitUntil: 'load'});
    
            const cardsArray =[];
            let firstPage = true;
            
            while (true){
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
                }, this._queryId);
                
                cardsArray.push(cards);
                
                if (forward) {
                    await Promise.all([
                        await page.click('.pagination-list a[data-testid=pagination-forward]'),
                        await page.waitForSelector('.pagination-list', {timeout: 0}),
                    ])
                }
    
                if (firstPage) firstPage = false;
            }
        
            await page.close();
            await browser.close();
            
            return cardsArray;
        } catch (err) {
            console.error('SCRAPPING ERROR ---- ' + err);
            await browser.close();
        }
    }
}

module.exports = { Scrapper };