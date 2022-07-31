'use strict'

const bot = require('./bot/queryBot');
const { jobCronSender, jobCronCollector } = require('./cron');

jobCronSender.start();
jobCronCollector.start();
bot.launch();
// jobCron.stop();