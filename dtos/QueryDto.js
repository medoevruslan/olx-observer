'use strict'

module.exports = class QueryDto {
    id;
    category;
    searchQuery;
    regexForModel;
    regex;
    regexModelTxt;
    maxPrice;

    constructor(model) {
        this.id = model.id;
        this.regex = model.regex;
        this.category = model.category;
        this.maxPrice = model.maxPrice;
        this.regexForModel = model.regexForModel;
        this.regexModelTxt = model.regexModelTxt;
        this.searchQuery = model.searchQuery;
    }
}