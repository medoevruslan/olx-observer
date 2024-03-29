'use strict'

function filterByRegex({regex: {brand, model} ,data}, regexForModel) {
    return regexForModel && model ? 
    data.filter(el => brand.test(el.name) && model?.test(el.name)) : 
    data.filter(el => brand.test(el.name));

}

function fetchRegexFromQuery(query) {
    try {
        const brand = new RegExp(query.regex, 'i');
        const model = new RegExp(query.regexModelTxt, 'i');
        return { brand, model }
    } catch (err) {
        console.error(err);
        const brand = new RegExp(query.regex, 'i');
        const model = false;
        return { brand, model }
    }
}

module.exports = {
    filterByRegex,
    fetchRegexFromQuery
}
