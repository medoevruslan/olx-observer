import { Model } from "sequelize";
import "dotenv/config";

import { createInterface, Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { saveQueryToDb } from "./src/handlers/queryHandler.ts";
import type { SearchQuery } from "./src/handlers/queryHandler.ts";
import { yesNo } from "./src/bot/buttons/botContent.ts";
import {
  allBrands,
  categories,
  fotoBrands,
  laptopBrands,
  macbookRegex,
} from "./src/enums/index.ts";

type ReadlineInterface = Interface;
type CategoryName = keyof typeof categories;
type BrandKey = keyof typeof allBrands;
type ActualBrand = Exclude<BrandKey, "Back">;
type YesNoChoice = (typeof yesNo)[number];
type Validator = (value: string) => true | string;

interface StoredUser {
  chatId: string;
  userName: string;
}

interface PreparedQuery {
  chatId: string;
  userName: string;
  category: CategoryName;
  brand: ActualBrand;
  model: string;
  minPrice: number;
  maxPrice: number;
  regexModel: string;
  isRegexModel: boolean;
}

const NEXT_ACTIONS = {
  addMore: "Добавить ещё",
  exit: "Выйти",
} as const;

type NextAction = (typeof NEXT_ACTIONS)[keyof typeof NEXT_ACTIONS];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credentialsFilePath = path.join(
  __dirname,
  "data",
  "userCredentials.json"
);

const brandOptionsByCategory: Record<CategoryName, BrandKey[]> = {
  Фото: Object.keys(fotoBrands) as Array<keyof typeof fotoBrands>,
  Ноутбуки: Object.keys(laptopBrands) as Array<keyof typeof laptopBrands>,
  Планшеты: Object.keys(laptopBrands) as Array<keyof typeof laptopBrands>,
  Объективы: Object.keys(fotoBrands) as Array<keyof typeof fotoBrands>,
};

const yesNoChoices: readonly YesNoChoice[] = yesNo;
const categoryChoices = Object.keys(categories) as CategoryName[];

async function main() {
  const rl = createInterface({ input, output });

  try {
    console.log("=== Добавление запроса через CLI ===\n");

    const storedUsers = await loadStoredUsers();
    const { chatId, userName, isExisting } = await resolveUserCredentials(
      rl,
      storedUsers
    );

    if (!isExisting) {
      await rememberUserCredential({ chatId, userName });
    }

    let continueAdding = true;

    while (continueAdding) {
      const { categoryName, brand } = await pickCategoryAndBrand(rl);

      let regexModel: string | undefined;
      let model: string;
      let isRegexModel: boolean;

      if (categoryName === "Ноутбуки" && brand === "Apple") {
        regexModel = macbookRegex.arm;
        model = "macbook";
        isRegexModel = true;
      } else {
        model = await askUntilValid(rl, "Напишите модель: ", (value) => {
          const trimmed = value.trim();
          if (!trimmed) {
            return "Модель не может быть пустой";
          }
          return true;
        });

        const regexpAnswer = await selectFromList(
          rl,
          "Использовать точный поиск модели по REGEXP?",
          yesNoChoices
        );
        isRegexModel = regexpAnswer === "Да";

        if (isRegexModel) {
          regexModel = await askUntilValid(
            rl,
            "Напишите выражение: ",
            (value) => {
              const trimmed = value.trim();
              if (!trimmed) {
                return "Регулярное выражение не может быть пустым";
              }
              return true;
            }
          );
        }
      }

      const minPriceInput = await askUntilValid(
        rl,
        "<Min Цена?>: ",
        (value) => {
          const trimmed = value.trim();
          if (!trimmed) {
            return true;
          }

          if (!/^\d{3,5}$/.test(trimmed)) {
            return "Введите корректную сумму из 3-5 цифр";
          }
          return true;
        }
      );

      const minPrice = Number(minPriceInput === "" ? 0 : minPriceInput);

      const maxPriceInput = await askUntilValid(
        rl,
        "<Max Цена?>: ",
        (value) => {
          const trimmed = value.trim();
          if (!/^\d{3,5}$/.test(trimmed)) {
            return "Введите корректную сумму из 3-5 цифр";
          }
          return true;
        }
      );

      const maxPrice = Number(maxPriceInput);

      const summary = `ищем в категории ${categoryName} ${brand} ${model} Min Цена ${minPrice} Max Цена ${maxPrice}`;
      console.log("\n" + summary);
      if (regexModel) {
        console.log(regexModel);
      }

      const confirm = await selectFromList(
        rl,
        "Подтвердите добавление",
        yesNoChoices
      );

      if (confirm !== "Да") {
        console.log("Запрос отменён пользователем");
        const action = await selectNextAction(rl);
        continueAdding = action === NEXT_ACTIONS.addMore;
        continue;
      }

      const isObserved = await sendQuery({
        chatId,
        userName,
        category: categoryName,
        brand,
        model,
        minPrice,
        maxPrice,
        regexModel,
        isRegexModel,
      });

      if (isObserved) {
        console.log("Такой запрос уже выполняется");
      } else {
        console.log(
          `\n${categoryName} ${brand} ${model} - добавлен в список запросов`
        );
      }

      const action = await selectNextAction(rl);
      continueAdding = action === NEXT_ACTIONS.addMore;
    }
  } catch (error) {
    console.error("Произошла ошибка при добавлении запроса", error);
    process.exitCode = 1;
  } finally {
    rl.close();
    process.exit(1);
  }
}

async function pickCategoryAndBrand(rl: ReadlineInterface) {
  let categoryName = await selectCategory(rl);

  while (true) {
    const brand = await selectBrand(rl, categoryName);
    if (brand) {
      return { categoryName, brand };
    }
    categoryName = await selectCategory(rl);
  }
}

async function selectCategory(rl: ReadlineInterface) {
  return await selectFromList(rl, "Выберите категорию", categoryChoices);
}

async function selectBrand(
  rl: ReadlineInterface,
  categoryName: CategoryName
): Promise<ActualBrand | null> {
  const options = brandOptionsByCategory[categoryName];

  while (true) {
    const selection = await selectFromList(rl, "Выберите бренд", options);
    if (selection === "Back") {
      console.log("Возврат к выбору категории\n");
      return null;
    }
    return selection;
  }
}

async function selectFromList<T extends string>(
  rl: ReadlineInterface,
  title: string,
  options: readonly T[]
): Promise<T> {
  while (true) {
    console.log(`\n${title}:`);
    options.forEach((option, index) => {
      console.log(`  [${index + 1}] ${option}`);
    });
    const answer = (
      await rl.question("Введите номер или значение из списка: ")
    ).trim();

    const byNumber = Number(answer);
    if (
      Number.isInteger(byNumber) &&
      byNumber >= 1 &&
      byNumber <= options.length
    ) {
      return options[byNumber - 1];
    }

    const directMatch = options.find((option) => option === answer);
    if (directMatch) {
      return directMatch;
    }

    console.log("Неверный выбор, попробуйте снова");
  }
}

async function askUntilValid(
  rl: ReadlineInterface,
  question: string,
  validator: Validator
) {
  while (true) {
    const answer = await rl.question(question);
    const validation = validator(answer);
    if (validation === true) {
      return answer.trim();
    }
    console.log(validation);
  }
}

async function resolveUserCredentials(
  rl: ReadlineInterface,
  storedUsers: StoredUser[]
) {
  if (storedUsers.length === 0) {
    const chatId = await askChatId(rl);
    const userName = await askUserName(rl);
    return { chatId, userName, isExisting: false } as const;
  }

  const addNewOption = "Добавить нового пользователя";
  const options = storedUsers.map(
    (user) => `${user.chatId} (${user.userName})`
  );
  options.push(addNewOption);

  const selection = await selectFromList(
    rl,
    "Выберите сохранённого пользователя или добавьте нового",
    options
  );

  if (selection === addNewOption) {
    const chatId = await askChatId(rl);
    const userName = await askUserName(rl);
    return { chatId, userName, isExisting: false } as const;
  }

  const index = options.indexOf(selection);
  const selected = storedUsers[index]!;
  return {
    chatId: selected.chatId,
    userName: selected.userName,
    isExisting: true,
  } as const;
}

async function askChatId(rl: ReadlineInterface) {
  return await askUntilValid(rl, "Введите chatId пользователя: ", (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "chatId не может быть пустым";
    }
    return true;
  });
}

async function askUserName(rl: ReadlineInterface) {
  return await askUntilValid(
    rl,
    "Введите username пользователя (без @): ",
    (value) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return "username не может быть пустым";
      }
      return true;
    }
  );
}

async function loadStoredUsers(): Promise<StoredUser[]> {
  try {
    const data = await readFile(credentialsFilePath, "utf-8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isStoredUser);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function rememberUserCredential(record: StoredUser) {
  const users = await loadStoredUsers();
  const index = users.findIndex((user) => user.chatId === record.chatId);
  if (index >= 0) {
    users[index] = record;
  } else {
    users.push(record);
  }
  await mkdir(path.dirname(credentialsFilePath), { recursive: true });
  await writeFile(credentialsFilePath, JSON.stringify(users, null, 2), "utf-8");
}

async function selectNextAction(rl: ReadlineInterface): Promise<NextAction> {
  return await selectFromList(rl, "Выберите действие", [
    NEXT_ACTIONS.addMore,
    NEXT_ACTIONS.exit,
  ]);
}

async function sendQuery(data: PreparedQuery) {
  const payload: SearchQuery = {
    chatId: data.chatId,
    userName: data.userName,
    category: categories[data.category],
    brand: data.brand,
    model: data.model,
    minPrice: data.minPrice,
    maxPrice: data.maxPrice,
    regexBrand: allBrands[data.brand],
    regexModel: data.isRegexModel ? data.regexModel : undefined,
    isRegexModel: data.isRegexModel,
  };

  return await saveQueryToDb(payload);
}

function isStoredUser(value: unknown): value is StoredUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<StoredUser>;
  return (
    typeof candidate.chatId === "string" &&
    typeof candidate.userName === "string"
  );
}

void main();
