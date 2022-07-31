'use strict'

const { Markup, Scenes } = require('telegraf');
const { options, startBtn } = require('../buttons/botContent');
const { getQueriesFromDb, updateQueryById, deleteById, getQueryById } = require('../../controller/quieryController');
const { fetchRegexFromQuery } = require('../../handlers/regexHandler')

function createInlineKeyboard(buttonName = [], cols = 1) {
    const btns = buttonName.map(btn => Markup.button.callback(btn, btn));
    return Markup.inlineKeyboard(btns, { columns: cols });
}

const queryKeyboard = (queryId, results, regex) => { 
    const switcher = regex ? 'ON' : 'OFF';
    return Markup.inlineKeyboard([
    [Markup.button.callback('EDIT', `EDIT:${queryId}`),
    Markup.button.callback('REMOVE', `REMOVE:${queryId}`)],
    [Markup.button.callback(`REGEX-${switcher}`, `REGEX-SWITCH:${queryId}`)],
    [{ text: `RESULTS ( ${results} ) `, callback_data: `GET ALL RESULTS:${queryId}` }]
]).resize()};

const optionsBtn = createInlineKeyboard(options);
const optionsScene = new Scenes.BaseScene('optionsScene');

optionsScene.hears(startBtn.search, ctx => ctx.scene.enter('searchWizard'));
optionsScene.hears(startBtn.options, ctx => ctx.scene.enter('optionsScene'));

optionsScene.enter(async (ctx) => {
    try {
        ctx.scene.state.data = {};
        await ctx.replyWithHTML('Опции', optionsBtn);
    } catch (err) {
        console.log(err);
    }
});

optionsScene.command('/start', async (ctx) => {
    try {
        await ctx.scene.leave();
        await ctx.reply('С чего начнем?', Markup.keyboard([
            [startBtn.search],
            [startBtn.options]
        ]).resize().oneTime());
    } catch (err) {
        console.log(err)
    }
})

optionsScene.action(options, async (ctx) => {
    try {
        const isExist = await unwrapQueries(ctx);
        if (!isExist) return await ctx.reply('Пока нет запросов');
    } catch (err) {
        console.log(err);
    }
});

optionsScene.action(/^edit:\d*$/i, async (ctx) => {
    try {
        const [method, id] = ctx.callbackQuery.data.split(':');
        ctx.scene.state.data.queryId = id;
        ctx.scene.state.data.method = method;
        ctx.scene.state.data.edit = ctx.callbackQuery.message;
        await ctx.reply('Напишите новую цену');
    } catch (err) {
        console.log(err);
    }
})

optionsScene.on('text', async (ctx) => {
    try {
        const { queryId, method } = ctx.scene.state.data;
        if (queryId == undefined && method !== 'EDIT') return;
        if (!(/^\d{3,5}$/.test(ctx.message.text))) await ctx.reply('нужна адекватная цена');
        const toEdit = ctx.scene.state.data.edit;
        const newPrice = ctx.message.text;
        const newPriceText = toEdit.text.replace(/max price: \d{3,5}/, `*__max price: ${newPrice}__*`);
        const isSuccess = await updateQueryById(queryId, 'maxPrice', newPrice);
        isSuccess ? await ctx.reply('Готово') : await ctx.reply('Нe прошло');
        editMessage(ctx, toEdit.chat.id, toEdit.message_id, newPriceText, queryId)
    } catch (err) {
        console.log(err);
    }
})

optionsScene.action(/^remove:\d*$/i, async (ctx) => {
    try {
        const id = ctx.callbackQuery.data.split(':')[1];
        const isSucess = await deleteById(id);
        const { messageId } = ctx.callbackQuery.message;
        if (isSucess) await ctx.deleteMessage(messageId);
    } catch (err) {
        console.log(err);
    }
})

optionsScene.action(/^regex-switch:\d*$/i, async (ctx) => {
    try {
        let id = ctx.callbackQuery.data.split(':')[1];
        const toEdit = ctx.callbackQuery.message;
        const { regexForModel } = await getQueryById(id);
        const switcher = regexForModel ? 'OFF' : 'ON';
        await updateQueryById(id, 'regexForModel', !regexForModel);
        const newRegexText = toEdit.text.replace(/\bon|off\b/i, `${switcher}`);
        editMessage(ctx, toEdit.chat.id, toEdit.message_id, newRegexText, id, switcher)
    } catch (err) {
        console.log(err);
    }
})

optionsScene.action(/^get all results:\d*$/i, async (ctx) => {
    try {
        let id = ctx.callbackQuery.data.split(':')[1];
        const query = await getQueryById(id);
        const cards = await query.getCards();
        await ctx.replyWithHTML(`<b>${query.searchQuery}</b>\n`);
        cards.forEach(async (card) => 
            await ctx.reply(card.link))
    } catch (err) {
        console.log(err);
    }
})

async function unwrapQueries(ctx) {
    try {
        const queries = await getQueriesFromDb();
        if (queries.length > 0) {
            await queries.forEach(async (qry) => {
                const cards = await qry.getCards(); 
                const regex = fetchRegexFromQuery(qry);
                await ctx.replyWithHTML(pretifyString(
`Поиск по запросу: ${qry.searchQuery}
regex: (${regex.brand}) and (${regex.model})    *${qry.regexForModel ? 'ON' : 'OFF'}*
max price: ${qry.maxPrice}`), queryKeyboard(qry.id, cards.length, qry.regexForModel))
            });
        }
        return queries.length > 0;
    } catch (err) {
        console.log(err);
    }
}

function pretifyString(string) {
    return string.replace(/-|q/gi, ' ');
}

function editMessage(ctx, chatId, messageId, newText, btnId, switcher) {
    ctx.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        newText,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'EDIT', callback_data: `EDIT:${btnId}` },
                        { text: 'REMOVE', callback_data: `REMOVE:${btnId}` },
                    ],
                    [{ text: `REGEX-${switcher}`, callback_data: `REGEX-SWITCH:${btnId}` }],
                    [{ text: 'RESULTS', callback_data: `GET ALL RESULTS:${btnId}` }]
                ]
            },
            parse_mode: 'HTML',
        }
    )
}


module.exports = optionsScene;