import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

import type { CardsResult } from "./types.ts";

const FORWARD_SELECTOR = ".pagination-list a[data-testid=pagination-forward]";
const FILTER_PRICE = {
  min: "search[filter_float_price:from]",
  max: "search[filter_float_price:to]",
};

export class Walker {
  private readonly rootUrl: URL;
  private browserPromise: Promise<Browser> | null = null;

  constructor(rootUrl = "https://www.olx.ua/") {
    this.rootUrl = new URL(rootUrl);
  }

  private async getBrowser() {
    if (!this.browserPromise) {
      this.browserPromise = chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-gpu"],
      });
    }

    return this.browserPromise;
  }

  private async createPage(): Promise<{ context: BrowserContext; page: Page }> {
    const browser = await this.getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    return { context, page };
  }

  private buildUrl(
    category = "",
    searchQuery = "",
    minPrice: number,
    maxPrice: number
  ) {
    const url = new URL(category + searchQuery, this.rootUrl);
    url.searchParams.set("currency", "UAH");
    url.searchParams.append(FILTER_PRICE.min, minPrice.toString());
    url.searchParams.append(FILTER_PRICE.max, maxPrice.toString());
    return url;
  }

  private async extractCards(
    page: Page,
    queryId: number
  ): Promise<CardsResult[]> {
    return await page.evaluate((qid) => {
      return [...document.querySelectorAll("div[data-cy=l-card]")].map((el) => {
        return {
          name: el.querySelector("h4")?.textContent ?? "wrongSelector",
          price:
            el.querySelector("p[data-testid=ad-price]")?.textContent ??
            "wrongSelector",
          link: "olx.ua" + (el.querySelector("a")?.getAttribute("href") ?? ""),
          time: el
            .querySelector("p[data-testid=location-date]")
            ?.textContent.split(" - ")[1],
          queryId: qid,
        };
      });
    }, queryId);
  }

  async execute(
    category = "",
    searchQuery = "",
    minPrice: number,
    maxPrice: number,
    queryId: number
  ) {
    console.log("\x1b[31m%s\x1b[0m", "START WALKING ---->>> ");

    const { context, page } = await this.createPage();
    const cardsArray: CardsResult[][] = [];
    const targetUrl = this.buildUrl(
      category,
      searchQuery,
      minPrice,
      maxPrice
    ).href;

    try {
      await page.goto(targetUrl, { waitUntil: "load" });

      while (true) {
        const cards = await this.extractCards(page, queryId);
        cardsArray.push(cards);

        const forwardLocator = page.locator(FORWARD_SELECTOR);
        const hasForward = (await forwardLocator.count()) > 0;

        if (!hasForward) {
          break;
        }

        await Promise.all([
          forwardLocator.first().click(),
          page.waitForLoadState("load"),
        ]);
      }
    } finally {
      await context.close();
      console.log("\x1b[31m%s\x1b[0m", "WALKING COMPLETED ---- ");
    }

    return cardsArray;
  }

  async close() {
    if (this.browserPromise) {
      const browser = await this.browserPromise;
      await browser.close();
      this.browserPromise = null;
    }
  }
}
