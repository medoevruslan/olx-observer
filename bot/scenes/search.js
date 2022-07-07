'use strict'

const { fotoBrands, laptopBrands, yesNo, categories, allBrands } = require('../buttons/botContent');
const { processQueryToDb } = require('../../handlers/queryHandler')
const { Markup, Scenes, Composer } = require('telegraf');
const { startBtn } = require('../buttons/botContent');

function createInlineKeyboard(buttonName = [], cols = 1) {
    const btns = buttonName.map(btn => Markup.button.callback(btn, btn));
    return Markup.inlineKeyboard(btns, { columns: cols });
}
const categoryBtn = createInlineKeyboard(Object.keys(categories), 2);
const fotoBrandBtn = createInlineKeyboard(Object.keys(fotoBrands), 3);
const laptopBrandBtn = createInlineKeyboard(Object.keys(laptopBrands), 3);
const yesNoBtn = createInlineKeyboard(yesNo);

const brandBtn = {
    Фото: fotoBrandBtn,
    Ноутбуки: laptopBrandBtn,
    Планшеты: laptopBrandBtn,
    Объективы: fotoBrandBtn,
}

const startStep = new Composer();
startStep.on('text', async (ctx) => {
    try {
        ctx.wizard.state = {};
        await ctx.replyWithHTML('Выберите <b>категорию</b>', categoryBtn);
        return ctx.wizard.next();
    } catch (err) {
        console.log(err);
    }
});

const brandStep = new Composer();
brandStep.action(Object.keys(categories), async (ctx) => {
    try {
        ctx.wizard.state.category = ctx.callbackQuery.data;
        const btns = brandBtn[ctx.callbackQuery.data];
        ctx.wizard.state.btns = btns;
        await ctx.replyWithHTML('Выберите <b>Бренд</b>', btns);
        return ctx.wizard.next();
    } catch (err) {
        console.log(err);
    }
});

const modelStep = new Composer();
modelStep.action(Object.keys(allBrands), async (ctx) => {
    try {
        if (ctx.callbackQuery.data === "Back") {
            await ctx.editMessageReplyMarkup(null);
            await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
            return await ctx.wizard.selectStep(1);
        }
        ctx.wizard.state.brand = ctx.callbackQuery.data;
        await ctx.replyWithHTML('Напишите <b>Модель</b>');
        return ctx.wizard.next();
    } catch (err) {
        console.log(err);
    }
});

const modelRegexpQuestionStep = new Composer();
modelRegexpQuestionStep.on('text', async (ctx) => {
    try {
        ctx.wizard.state.model = ctx.message.text;
        await ctx.replyWithHTML('Использовать точный поиск модели по REGEXP?', yesNoBtn);
        return ctx.wizard.next();
    } catch (err) {
        console.log(err);
    }
});

const modelRegexpTextStep = new Composer();
modelRegexpTextStep.action(yesNo, async (ctx) => {
    ctx.wizard.state.modelRegexApply = ctx.callbackQuery.data;
    if (ctx.callbackQuery.data === 'Да') {
        await ctx.reply('Напишите выражение');
        return ctx.wizard.next();
    }else {
        await ctx.replyWithHTML('<b>Цена ?</b>');
        ctx.wizard.selectStep(5);
        return ctx.wizard.next();
    }
})

const priceStep = new Composer();
priceStep.on('text', async (ctx) => {
    ctx.wizard.state.modelRegex = ctx.message.text;
    try {
        await ctx.replyWithHTML('<b>Цена ?</b>');
        return ctx.wizard.next();
     } catch (err) {
        console.log(err);
    }
});

const recapStep = new Composer();
recapStep.on('text', async (ctx) => {
    if (!(/^\d{3,5}$/.test(ctx.message.text))) {
        await ctx.reply('Введите корректную сумму');
        return;
    }
    try {
        ctx.wizard.state.price = ctx.message.text;
        const { price, model, brand, category, modelRegex} = ctx.wizard.state;
        await ctx.replyWithHTML(
            `ищем в категории <b>${category}</b> ${brand} ${model} Цена ${price}\n${modelRegex ?? ''}`, 
            yesNoBtn);
        return ctx.wizard.next();
    } catch (err) {
        console.log(err);
    }
});

const authenticateStep = new Composer();
authenticateStep.action(yesNo, async (ctx) => {
    try {
        const { brand, model, category, price, modelRegex, modelRegexApply} = ctx.wizard.state;
        if (ctx.callbackQuery.data === 'Да') {
            const { id, username } = ctx.from;
            const isObserved = await sendQuery({id, username, brand, model, category, price, modelRegex, modelRegexApply})
            if (isObserved) {
                await ctx.reply('Такой запрос уже выполняется'); 
                ctx.wizard.selectStep(2);
                await ctx.replyWithHTML('Выберите <b>Бренд</b>', fotoModelBtn);
            }
            else {
                await ctx.replyWithHTML(`<b>${category} ${brand} ${model}</b> -  добавлен в список запросов`);
                await ctx.editMessageReplyMarkup(null);
                await ctx.reply('Продолжим', Markup.keyboard([
                    [startBtn.search],
                    [startBtn.options]
                ]).oneTime().resize())
                return ctx.scene.leave('searchWizard');
            }
        } else {
            await ctx.wizard.selectStep(1)
            await ctx.editMessageReplyMarkup(null);
            return await ctx.replyWithHTML('Выберите <b>категорию</b>', categoryBtn);
        }
    } catch (err) {
        console.log(err);
    }
});

async function sendQuery(data) {
    return await processQueryToDb({
        chatId: data.id.toString(),
        userName: data.username,
        category: categories[data.category],
        brand: data.brand,
        model: data.model,
        maxPrice: data.price,
        regex: allBrands[data.brand],
        regexModelTxt: data.modelRegex,
        regexForModel: data.modelRegexApply === 'Да' ? true : false
    });
}

const searchScene = new Scenes.WizardScene('searchWizard', 
startStep, brandStep, modelStep, modelRegexpQuestionStep,
modelRegexpTextStep, priceStep, recapStep, authenticateStep);

module.exports = searchScene;