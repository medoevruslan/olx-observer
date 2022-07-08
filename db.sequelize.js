const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
    });

module.exports = sequelize;

