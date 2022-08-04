'use strict'

module.exports = class QueryDto {
    queryId;
    category;
    searchQuery;
    regexForModel;
    regex;
    regexModelTxt;
    maxPrice;

    constructor(model) {
        this.queryId = model.id;
        this.regex = model.regex;
        this.category = model.category;
        this.maxPrice = model.maxPrice;
        this.regexForModel = model.regexForModel;
        this.regexModelTxt = model.regexModelTxt;
        this.searchQuery = model.searchQuery;
    }
}