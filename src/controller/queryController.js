'use strict'

const { Query } = require('../models/query');

async function getQueriesFromDb() {
    const queries = await Query.findAll()
    return queries;
};

async function updateQueryById(id, field, value) {
    return await Query.update({ [field]: value }, { where: { id: id } });
}

async function deleteById(id) {
    return await Query.destroy({ where: { id: id } });
}

async function getQueryById(id) {
    return await Query.findByPk(id)
}

module.exports = {
    getQueriesFromDb,
    updateQueryById,
    deleteById,
    getQueryById,
}