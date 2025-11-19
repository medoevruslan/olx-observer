import "dotenv/config";

import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  deleteById,
  getQueriesFromDb,
  getQueryById,
  updateQueryById,
} from "./src/controller/queryController.ts";
import { createRegex } from "./src/handlers/regexHandler.ts";
import type { QueryModel } from "./src/models/Query.ts";

type ReadlineInterface = Interface;

const LIST_PROMPT = "Выберите номер запроса ('q' для выхода): ";

const ACTIONS = [
  { key: "1", value: "summary", label: "Показать детали запроса" },
  { key: "2", value: "cards", label: "Показать сохранённые объявления" },
  { key: "3", value: "price", label: "Изменить максимальную цену" },
  { key: "4", value: "regex-toggle", label: "Переключить фильтр модели" },
  { key: "5", value: "regex-edit", label: "Изменить выражение REGEXP" },
  { key: "6", value: "remove", label: "Удалить запрос" },
  { key: "7", value: "back", label: "Вернуться к списку" },
  { key: "q", value: "quit", label: "Выйти" },
] as const;

type Action = (typeof ACTIONS)[number];
type ActionValue = Action["value"];

async function main() {
  const rl = createInterface({ input, output });

  try {
    await showQueriesLoop(rl);
  } catch (error) {
    console.error("Ошибка при работе со списком запросов", error);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

async function showQueriesLoop(rl: ReadlineInterface) {
  while (true) {
    const queries = await getQueriesFromDb();
    if (!queries.length) {
      console.log("Запросов пока нет");
      return;
    }

    printQueriesList(queries);
    const selection = (await rl.question(LIST_PROMPT)).trim().toLowerCase();

    if (selection === "q") {
      process.exit(1);
    }

    if (selection === "") {
      continue;
    }

    const index = Number(selection) - 1;
    if (Number.isNaN(index) || index < 0 || index >= queries.length) {
      console.log("Неверный выбор, попробуйте снова\n");
      continue;
    }

    const queryId = queries[index]!.id;
    const continueLoop = await handleQueryActions(rl, queryId);
    if (!continueLoop) {
      process.exit(1);
    }
  }
}

function printQueriesList(queries: QueryModel[]) {
  console.log("\nСохранённые запросы:\n");
  queries.forEach((query, idx) => {
    const switcher = query.isRegexModel ? "ON" : "OFF";
    console.log(
      `[${idx + 1}] #${query.id} ${query.searchQuery} | min: ${
        query.minPrice
      } | max: ${query.maxPrice} | regex: ${switcher}`
    );
  });
  console.log("");
}

async function handleQueryActions(rl: ReadlineInterface, queryId: number) {
  while (true) {
    const query = await getQueryById(queryId);
    if (!query) {
      console.log("Запрос не найден, возможно он был удалён");
      return true;
    }

    console.log(formatQueryDetails(query));
    printActions();
    const answer = (await rl.question("Выберите действие: "))
      .trim()
      .toLowerCase();

    const action = resolveAction(answer);
    if (!action) {
      console.log("Неизвестное действие\n");
      continue;
    }

    switch (action) {
      case "summary":
        console.log(formatQueryDetails(query));
        break;
      case "cards":
        await showCards(query);
        break;
      case "price":
        await updatePrice(rl, query);
        break;
      case "regex-toggle":
        await toggleRegex(query);
        break;
      case "regex-edit":
        await updateRegexPattern(rl, query);
        break;
      case "remove": {
        const confirmed = await confirmAction(rl, "Удалить запрос? (y/n): ");
        if (confirmed) {
          await deleteById(query.id);
          console.log("Запрос удалён\n");
          return true;
        }
        break;
      }
      case "back":
        return true;
      case "quit":
        return false;
    }
  }
}

function printActions() {
  console.log("Доступные действия:");
  ACTIONS.forEach((action: Action) => {
    console.log(`  [${action.key}] ${action.label}`);
  });
}

function resolveAction(input: string): ActionValue | null {
  const found = ACTIONS.find(
    (action) => action.key === input || action.value === input
  );
  return found ? found.value : null;
}

function formatQueryDetails(query: QueryModel) {
  const regex = createRegex({
    regexBrand: query.regexBrand,
    regexModel: query.regexModel,
  });
  return `\n#${query.id} ${query.searchQuery}
Regex brand: ${regex.brand}
Regex model: ${regex.model} (${query.isRegexModel ? "ON" : "OFF"})
Max price: ${query.maxPrice}\n`;
}

async function showCards(query: QueryModel) {
  const cards = await query.getCards();
  if (!cards.length) {
    console.log("Нет сохранённых объявлений\n");
    return;
  }
  console.log(`\n${query.searchQuery} — найдено ${cards.length} объявлений:`);
  cards.forEach((card, idx) => {
    console.log(`[${idx + 1}] ${card.name} | ${query.maxPrice} | ${card.link}`);
  });
  console.log("");
}

async function updatePrice(rl: ReadlineInterface, query: QueryModel) {
  const answer = await rl.question("Новая максимальная цена (3-5 цифр): ");
  const trimmed = answer.trim();
  if (!/^\d{3,5}$/.test(trimmed)) {
    console.log("Укажите корректное значение\n");
    return;
  }

  await updateQueryById(query.id, "maxPrice", Number(trimmed));
  console.log("Цена обновлена\n");
}

async function toggleRegex(query: QueryModel) {
  const nextValue = !query.isRegexModel;
  await updateQueryById(query.id, "isRegexModel", nextValue);
  console.log(`Фильтр модели: ${nextValue ? "ON" : "OFF"}\n`);
}

async function updateRegexPattern(rl: ReadlineInterface, query: QueryModel) {
  while (true) {
    const choice = (
      await rl.question("Изменить [1] бренд, [2] модель, [Enter] - отмена: ")
    )
      .trim()
      .toLowerCase();

    if (!choice) {
      console.log("Изменение отменено\n");
      return;
    }

    if (choice === "1") {
      const current = query.regexBrand ?? "";
      const pattern = await rl.question(
        `Новое выражение бренда (текущее: ${current}) — Enter, чтобы оставить: `
      );
      const trimmed = pattern.trim();
      if (!trimmed) {
        console.log("Regex бренда не изменён\n");
        return;
      }
      if (!isValidRegex(trimmed)) {
        console.log("Некорректное регулярное выражение\n");
        continue;
      }
      await updateQueryById(query.id, "regexBrand", trimmed);
      console.log("Regex бренда обновлён\n");
      return;
    }

    if (choice === "2") {
      const current = query.regexModel ?? "-";
      const pattern = await rl.question(
        `Новое выражение модели (текущее: ${current}) — Enter оставить, '-' удалить: `
      );
      const trimmed = pattern.trim();
      if (!trimmed) {
        console.log("Regex модели не изменён\n");
        return;
      }
      if (trimmed === "-") {
        await updateQueryById(query.id, "regexModel", null);
        console.log("Regex модели очищен\n");
        return;
      }
      if (!isValidRegex(trimmed)) {
        console.log("Некорректное регулярное выражение\n");
        continue;
      }
      await updateQueryById(query.id, "regexModel", trimmed);
      console.log("Regex модели обновлён\n");
      return;
    }

    console.log("Неверный выбор\n");
  }
}

function isValidRegex(pattern: string) {
  try {
    new RegExp(pattern, "i");
    return true;
  } catch {
    return false;
  }
}

async function confirmAction(rl: ReadlineInterface, prompt: string) {
  while (true) {
    const answer = (await rl.question(prompt)).trim().toLowerCase();
    if (["y", "yes", "д", "да"].includes(answer)) {
      return true;
    }
    if (["n", "no", "н", "нет"].includes(answer)) {
      return false;
    }
    console.log("Введите 'y' или 'n'");
  }
}

void main();
