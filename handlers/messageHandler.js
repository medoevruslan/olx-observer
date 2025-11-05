'use strict'

require('dotenv').config();
const https = require('https');
const {Query} = require('../models/query');
const {User} = require('../models/user');

async function sendToBot() {

    const postOptions = {
        host: 'api.telegram.org',
        path: `/bot${process.env.BOT_TOKEN}/`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    }

    const queries = await Query.findAll({ include: { model: User } });

    const updates = [];
    const messagePromises = [];

    for (const query of queries) {
        const cards = await query.getCards();
        const lastDate = cards.reduce((date, card) => Math.max(date, card.time), 0);

        const selectedCards = cards.filter(card => card.time > query.lastDateCard);
        let hasHeader = !selectedCards.length;

        messagePromises.push(
            Promise.all(selectedCards.map(async card => {
                if (!hasHeader) {
                    hasHeader = true;
                }
                return sendMessage(query.client.chatId, card, postOptions, hasHeader);
            }))
        );

        if (query.lastDateCard < lastDate) {
            updates.push(query.update({ lastDateCard: lastDate }));
        }
    }

    await Promise.all(updates);
    await Promise.all(messagePromises.flat());

}

function sendMessage(chatId, data, postOptions, hasHeader) {
    const prettyDate = data.createdAt.toISOString?.()?.split?.('T')[0]
        // .toLocaleString('ru',
        // {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'});

    const text = hasHeader ? data.link : `<b>${prettyDate}</b>\n${data.link}`;

    const body = {
        method: 'sendMessage',
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    }

    const req = https.request(postOptions, res => {
        console.log('making a request to telegram server');
        res
            .on('data', () => {
                console.log('got a response from telegram server');
            })
            .on('error', err => {
                console.log('Have an error when send Message to client -- ' + err);
            })
            .on('close', () => {
                console.log('connection is closed, moving further');
                res.destroy();
            })
    });

    req.end(JSON.stringify(body));
}

module.exports = sendToBot;


