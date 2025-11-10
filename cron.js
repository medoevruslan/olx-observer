"use strict";

const { addCardsToDb } = require("./src/handlers/queryHandler");
const sendToBot = require("./src/handlers/messageHandler");

const jobSendAddCards = async () => {
  console.log("_______________(ADDING CARDS TO DATABASE)______________");
  await addCardsToDb();
  setTimeout(async () => {
    console.log("______________ (SENDING MESSAGES) ______________");
    await sendToBot();
    setTimeout(() => jobSendAddCards(), 60 * 4 * 1000);
  }, 60 * 4 * 1000);
};

module.exports = {};
