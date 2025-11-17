import type { Page } from "puppeteer";
import type { CardsResult } from "./types.ts";

import { Cluster } from "puppeteer-cluster";

type WalkerTaskPayload = {
  url: string;
  queryId: number;
};

export class Walker {
  private readonly _rootUrl: URL;
  private _clusterPromise:
    | Promise<Cluster<WalkerTaskPayload, CardsResult[][]>>
    | null = null;

  constructor(rootUrl = "https://www.olx.ua/") {
    this._rootUrl = new URL(rootUrl);
  }

  private async getCluster() {
    if (!this._clusterPromise) {
      this._clusterPromise = (async () => {
        const cluster = await Cluster.launch({
          concurrency: Cluster.CONCURRENCY_PAGE,
          maxConcurrency: 10,
          puppeteerOptions: {
            headless: true,
            timeout: 0,
            args: ["--no-sandbox", "--disable-gpu"],
          },
        });

        await cluster.task(this.runTask.bind(this));
        return cluster;
      })();
    }

    return this._clusterPromise;
  }

  private async runTask({
    page,
    data,
  }: {
    page: Page;
    data: WalkerTaskPayload;
  }) {
    console.log("\x1b[31m%s\x1b[0m", "START WALKING ---- ");

    await page.goto(data.url, { waitUntil: "load" });
    let firstPage = true;
    const cardsArray: CardsResult[][] = [];

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
      }, data.queryId);

      cardsArray.push(cards);

      if (forward) {
        await Promise.all([
          page.click(".pagination-list a[data-testid=pagination-forward]"),
          page.waitForSelector(".pagination-list", { timeout: 0 }),
        ]);
      }

      if (firstPage) firstPage = false;
    }

    console.log("\x1b[31m%s\x1b[0m", "WALKING COMPLETED ---- ");
    return cardsArray;
  }

  private buildUrl(category = "", searchQuery = "") {
    const url = new URL(category + searchQuery, this._rootUrl);
    url.searchParams.set("currency", "UAH");
    return url;
  }

  async execute(category = "", searchQuery = "", queryId: number) {
    const cluster = await this.getCluster();
    const url = this.buildUrl(category, searchQuery).href;
    return cluster.execute({ url, queryId });
  }
}
