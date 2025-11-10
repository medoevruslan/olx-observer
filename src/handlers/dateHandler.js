'use strict'

const moment = require('moment');

function dateToTimestamp(cards) {
    return cards.map(card => {
        card.time = dateParser(card.time);
        return card;
    });
}

function dateParser(date) {
    let result;
    if (date.startsWith('Сегодня') || date.startsWith('Вчера')) {
        const [day, time] = date.split(' в ');
        
        switch (day) {
            case 'Сегодня':
                result = new Date().setHours(time.split(':')[0], time.split(':')[1]);
                break;
            case 'Вчера':
                const tempDate = new Date();
                const yesterday = tempDate.setDate(yesterday.getDate() - 1);
                result = yesterday.setHours(time.split(':')[0], time.split(':')[1]);
                break;
        }
    } else {
        result = moment.utc(date, 'LL', 'ru').toDate().getTime();
    }
    return result;
}

module.exports = { 
    dateToTimestamp,
};