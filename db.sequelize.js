const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(
    'olx_bot', 
    'newuser', 
    '927199', {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
    });

module.exports = sequelize;

