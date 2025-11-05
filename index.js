'use strict'

const bot = require('./bot/queryBot');
const { jobSendAddCards, cronAddCards, cronSendMessages} = require('./cron');
const {addCardsToDb} = require("./handlers/queryHandler");
const sendToBot = require("./handlers/messageHandler");
const cron = require('node-cron');

// jobSendAddCards();
cron.schedule('*/4 * * * *', () => {
    console.log('_______________(ADDING CARDS TO DATABASE)______________');
    addCardsToDb();
})

cron.schedule('6,12,18,26,35,38,43,49,53,59 * * * *', () => {
    console.log('______________ (SENDING MESSAGES) ______________');
    sendToBot();
})

bot.launch();
