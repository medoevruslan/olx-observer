'use strict'

const { DataTypes } = require('sequelize');
const sequelize = require('../db.sequelize');

const Card = sequelize.define('card', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    time: {
        type: DataTypes.DATE,
        allowNull: false,
    }
});

module.exports = { Card };