import type { CardsResult } from "./types.ts";

import { Cluster } from "puppeteer-cluster";

export class Walker {
  private _URL: URL;
  private _URL_CATEGORY: URL | null = null;
  private _queryId: number = -1;

  constructor(rootUrl = "https://www.olx.ua/") {
    this._URL = new URL(rootUrl);
  }

  initQuery(category = "", searchQuery = "", queryId: number) {
    this._URL_CATEGORY = new URL(category + searchQuery, this._URL);
    this._URL_CATEGORY.searchParams.set("currency", "UAH");
    this._queryId = queryId;
  }

  async execute() {
    if (!this._URL_CATEGORY) {
      throw new Error("Walker is not initialized");
    }
    console.log("\x1b[31m%s\x1b[0m", "START WALKING ---- ");
    let cardsArray: CardsResult[][] = [];
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency: 10, // Adjust the number of concurrent instances as needed
      puppeteerOptions: {
        headless: true,
        timeout: 0,
        args: ["--no-sandbox", "--disable-gpu"],
      },
    });

    await cluster.task(async ({ page, data: queryId }) => {
      await page.goto(this._URL_CATEGORY?.href, { waitUntil: "load" });

      let firstPage = true;

      while (true) {
        const forward = await page.$(
          ".pagination-list a[data-testid=pagination-forward]"
        );
        if (!forward && !firstPage) break;

        const cards = await page.evaluate((queryId: number) => {
          return [...document.querySelectorAll("div[data-cy=l-card]")].map(
            (el) => {
              return {
                name: el.querySelector("h4")?.textContent ?? "wrongSelector",
                price:
                  el.querySelector("p[data-testid=ad-price]")?.textContent ??
                  "wrongSelector",
                link: "olx.ua" + el.querySelector("a")?.getAttribute("href"),
                time: el
                  .querySelector("p[data-testid=location-date]")
                  ?.textContent.split(" - ")[1],
                queryId: queryId,
              };
            }
          );
        }, queryId);

        cardsArray.push(cards);

        if (forward) {
          await Promise.all([
            page.click(".pagination-list a[data-testid=pagination-forward]"),
            page.waitForSelector(".pagination-list", { timeout: 0 }),
          ]);
        }

        if (firstPage) firstPage = false;
      }
    });

    await cluster.execute(this._queryId);

    await cluster.idle();
    await cluster.close();

    console.log("\x1b[31m%s\x1b[0m", "WALKING COMPLETED ---- ");
    return cardsArray;
  }
}
