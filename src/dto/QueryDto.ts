import type { QueryModel } from "../models/Query.ts";

export class QueryDto {
  queryId;
  category;
  searchQuery;
  isRegexModel;
  regexBrand;
  regexModel;
  maxPrice;

  constructor(model: QueryModel) {
    this.queryId = model.id;
    this.category = model.category;
    this.maxPrice = model.maxPrice;
    this.isRegexModel = model.isRegexModel;
    this.regexBrand = model.regexBrand;
    this.regexModel = model.regexModel;
    this.searchQuery = model.searchQuery;
  }
}
