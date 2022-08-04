'use strict'

require('dotenv').config();
const  https  = require('https');
const { Query } = require('../models/query');
const { User } = require('../models/user');

async function sendToBot() {

    const postOptions = {
        host: 'api.telegram.org',
        path: `/bot${process.env.BOT_TOKEN}/`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    }

    const queries = await Query.findAll({include: {model: User}});
    queries.forEach(async (query) => {
        const cards = await query.getCards();
        const lastDate = cards.reduce((date, card) => card.time > date ? date = card.time : date, 0);
        
        let hasHeader = false;
        cards.filter(card => card.time > query.lastDateCard).forEach(async card => {
            setTimeout(() => { 
                sendMessage(query.client.chatId, card, postOptions, hasHeader) 
                if (!hasHeader) hasHeader = true;
            }, 1000);
           
        })

        if (query.lastDateCard < lastDate) {
            await query.update({lastDateCard: lastDate})
        }
    });
};

function sendMessage(chatId, data, postOptions, hasHeader) {
    const prettyDate = data.createdAt.toLocaleString('ru', 
    {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'});
    
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


