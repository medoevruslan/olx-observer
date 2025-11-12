import { DataTypes } from "sequelize";
import { sequelize } from "../db/db.sequelize.ts";
import { Query } from "./Query.ts";

export const User = sequelize.define(
  "client",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    chatId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  { timestamps: false }
);

User.hasMany(Query);
Query.belongsTo(User, { onDelete: "CASCADE" });

export type UserModel = {
  id: number;
  chatId: string;
  userName: string;
};
