import { Sequelize } from "sequelize";
import "dotenv/config";

export const sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "postgres",
    host: "localhost",
    port: 5433,
    pool: {
      max: 10,
      min: 5,
      idle: 60 * 3 * 1000,
    },
    ssl: true,
    logging: false,
    sync: true,
  }
);
