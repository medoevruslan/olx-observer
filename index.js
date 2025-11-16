"use strict";

const bot = require("./src/bot/queryBot");
const sendToBot = require("./src/handlers/messageHandler");
const cron = require("node-cron");
const { Walker } = require("./src/core/Walker");
const { getCards } = require("./src/handlers/queryHandler");
const { saveCardsToDb } = require("./src/handlers/queryHandler");
require("dotenv").config();

const walker = new Walker();

// jobSendAddCards();
cron.schedule("*/4 * * * *", async () => {
  console.log("_______________(ADDING CARDS TO DATABASE)______________");
  const cards = await getCards(walker);
  saveCardsToDb(cards);
});

cron.schedule("6,12,18,26,35,38,43,49,53,59 * * * *", () => {
  console.log("______________ (SENDING MESSAGES) ______________");
  sendToBot();
});

bot.launch();
