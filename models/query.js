'use strict'

const { DataTypes } = require('sequelize');
const sequelize = require('../db.sequelize');
const { Card } = require('./card');

const Query = sequelize.define('query', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    searchQuery: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    regex: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    maxPrice: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    lastDateCard: {
        type: DataTypes.DATE,
        defaultValue: 0
    },
    regexForModel: {
        type: DataTypes.BOOLEAN,
    },
    regexModelTxt: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, { timestamps : false})

Query.hasMany(Card);
Card.belongsTo(Query, {onDelete: 'CASCADE'});

module.exports = { Query } ;