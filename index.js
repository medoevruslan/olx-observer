'use strict'

const bot = require('./bot/queryBot');
const { jobSendAddCards } = require('./cron');

jobSendAddCards();
bot.launch();
