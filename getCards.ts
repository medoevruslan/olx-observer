import "dotenv/config";

import { getCards, saveCardsToDb } from "./src/handlers/queryHandler.ts";
import { Walker } from "./src/core/Walker.ts";

const walker = new Walker();
(async () => {
  const result = await getCards(walker);
  saveCardsToDb(result.flat());
})();
