const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        pool: {
            max: 10,
            min: 5,
            idle: 60*3*1000
        },
        ssl: true,
        logging: false
    });

module.exports = sequelize;

