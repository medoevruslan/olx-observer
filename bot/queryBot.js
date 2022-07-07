'use strict'

require('dotenv').config();
const { Telegraf, Markup, session, Scenes } = require('telegraf');
const searchWizard = require('./scenes/search');
const optionsWizard = require('./scenes/options');
const  sequelize  = require('../db.sequelize');
const { startBtn } = require('./buttons/botContent');

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([searchWizard, optionsWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.hears(startBtn.search, ctx => ctx.scene.enter('searchWizard'));
bot.hears(startBtn.options, ctx => ctx.scene.enter('optionsScene'));

bot.start(async (ctx) => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        await ctx.reply('С чего начнем?', Markup.keyboard([
            [startBtn.search],
            [startBtn.options]
        ]).resize().oneTime())
    } catch (err) {
        console.log(err);
    }
})
  
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;