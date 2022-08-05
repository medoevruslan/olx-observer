'use strict'

const { addCardsToDb } = require('./handlers/queryHandler');
const sendToBot = require('./handlers/messageHandler');

const jobSendAddCards = async () => {
	console.log('_______________(ADDING CARDS TO DATABASE)______________');
	const startTime = performance.now();
	await addCardsToDb();
	console.log(`time of scrapping (browser version) is ${performance.now() - startTime} milliseconds`);
	setTimeout(async () => {
		console.log('______________ (SENDING MESSAGES) ______________');
		 await sendToBot();
		 setTimeout(() => jobSendAddCards(), 60 * 3 * 1000)
		}, 60 * 2 * 1000) 
}

module.exports = { 
	jobSendAddCards
};