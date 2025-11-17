import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/db.sequelize.ts";

export const Card = sequelize.define<CardModel>("card", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

export interface CardModel extends Model {
  id: number;
  name: string;
  link: string;
  time: Date;
  createdAt: Date;
}
