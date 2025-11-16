import "dotenv/config";

import { sequelize } from "./src/db/db.sequelize.ts";

import "./src/models/User.ts";
import "./src/models/Query.ts";
import "./src/models/Card.ts";

async function main() {
  const force = process.argv.includes("--force");
  const alter = process.argv.includes("--alter");

  if (force && alter) {
    console.error("Нельзя использовать одновременно --force и --alter");
    process.exit(1);
    return;
  }

  try {
    console.log("Подключение к базе данных...");
    await sequelize.authenticate();
    console.log(`Синхронизация схемы (force=${force}, alter=${alter})...`);
    await sequelize.sync({ force, alter });
    console.log("Все таблицы синхронизированы");
  } catch (error) {
    console.error("Ошибка при синхронизации базы", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
