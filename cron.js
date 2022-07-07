'use strict'

const CronJob = require('cron').CronJob;
const { addCardsToDb } = require('./handlers/queryHandler');
const sendToBot = require('./handlers/messageHandler');


const jobCronSender = new CronJob(
	'*/7 * * * *',
	async function() {
		console.log('______________You will see this message every 7 minute (SENDING MESSAGES) ______________');
        await sendToBot();
	},
	null,
	false,
	'Europe/Kiev'
);

const jobCronCollector = new CronJob(
	'*/4 * * * *',
	async function() {
		console.log('_______________You will see this message every 4 minute (ADDING CARDS TO DATABASE)______________');
		await addCardsToDb();
	},
	null,
	false,
	'Europe/Kiev'
);

module.exports = { 
	jobCronSender, 
	jobCronCollector 
};