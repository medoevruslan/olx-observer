import type { QueryModel } from "../models/Query.ts";

export class QueryDto {
  queryId;
  category;
  searchQuery;
  regexForModel;
  regex;
  regexModelTxt;
  maxPrice;

  constructor(model: QueryModel) {
    this.queryId = model.id;
    this.regex = model.regex;
    this.category = model.category;
    this.maxPrice = model.maxPrice;
    this.regexForModel = model.regexForModel;
    this.regexModelTxt = model.regexModelTxt;
    this.searchQuery = model.searchQuery;
  }
}
