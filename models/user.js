const { DataTypes } = require('sequelize');
const sequelize = require('../db.sequelize');
const { Query } = require('./query');

const User = sequelize.define('client',  {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    chatId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
}, { timestamps: false });

User.hasMany(Query);
Query.belongsTo(User, {onDelete: 'CASCADE'});

module.exports = { User }