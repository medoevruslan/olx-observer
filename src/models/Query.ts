("use strict");

import { DataTypes } from "sequelize";
import { sequelize } from "../db/db.sequelize.ts";
import { Card } from "./Card.ts";

export const Query = sequelize.define(
  "query",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    searchQuery: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    regex: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    maxPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lastDateCard: {
      type: DataTypes.DATE,
      defaultValue: 0,
    },
    regexForModel: {
      type: DataTypes.BOOLEAN,
    },
    regexModelTxt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { timestamps: false }
);

Query.hasMany(Card);
Card.belongsTo(Query, { onDelete: "CASCADE" });

export type QueryModel = {
  id: number;
  category: string;
  searchQuery: string;
  regex: string;
  maxPrice: number;
  lastDateCard: Date | number; // Sequelize DATE with defaultValue 0
  regexForModel?: boolean; // optional
  regexModelTxt?: string | null; // optional + nullable
};
