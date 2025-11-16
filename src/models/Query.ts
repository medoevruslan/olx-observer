import { DataTypes, Model } from "sequelize";
import type { HasManyGetAssociationsMixin } from "sequelize";
import { sequelize } from "../db/db.sequelize.ts";

import { Card } from "./Card.ts";
import type { CardModel } from "./Card.ts";
import type { UserModel } from "./User.ts";

export const Query = sequelize.define<QueryModel>(
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

export interface QueryModel extends Model {
  id: number;
  category: string;
  searchQuery: string;
  regex: string;
  maxPrice: number;
  lastDateCard: Date | number; // Sequelize DATE with defaultValue 0
  regexForModel?: boolean; // optional
  regexModelTxt?: string | null; // optional + nullable
  getCards: HasManyGetAssociationsMixin<CardModel>;

  user: UserModel; // typed included user
}

export type CreateQueryDomainDto = {
  category: string;
  searchQuery: string;
  regex: string;
  maxPrice: number;
  regexForModel?: boolean; // optional
  regexModelTxt?: string | null; // optional + nullable
};
