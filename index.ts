import cron from "node-cron";
import { sendToBot } from "./src/handlers/messageHandler.ts";
import { Walker } from "./src/core/Walker.ts";
import { getCards, saveCardsToDb } from "./src/handlers/queryHandler.ts";
import "dotenv/config";

const walker = new Walker();

// jobSendAddCards();
cron.schedule("*/4 * * * *", async () => {
  console.log("_______________(ADDING CARDS TO DATABASE)______________");
  const cards = await getCards(walker);
  saveCardsToDb(cards.flat());
});

cron.schedule("6,12,18,26,35,38,43,49,53,59 * * * *", () => {
  console.log("______________ (SENDING MESSAGES) ______________");
  sendToBot();
});
