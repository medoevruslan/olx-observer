import "dotenv/config";

import { processQueryToDb } from "./src/handlers/queryHandler.ts";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  categories,
  fotoBrands,
  laptopBrands,
  allBrands,
  yesNo,
} from "./src/bot/buttons/botContent.ts";

const brandOptionsByCategory = {
  Фото: Object.keys(fotoBrands),
  Ноутбуки: Object.keys(laptopBrands),
  Планшеты: Object.keys(laptopBrands),
  Объективы: Object.keys(fotoBrands),
};

const yesNoChoices = yesNo;

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("=== Добавление запроса через CLI ===\n");

    const chatId = await askUntilValid(
      rl,
      "Введите chatId пользователя: ",
      (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return "chatId не может быть пустым";
        }
        return true;
      }
    );

    const userName = await askUntilValid(
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

    let categoryName = await selectCategory(rl);

    let brand;
    while (!brand) {
      brand = await selectBrand(rl, categoryName);
      if (!brand) {
        categoryName = await selectCategory(rl);
      }
    }

    const model = await askUntilValid(rl, "Напишите модель: ", (value) => {
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

    let regexModelTxt = "";
    const regexForModel = regexpAnswer === "Да";

    if (regexForModel) {
      regexModelTxt = await askUntilValid(
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

    const priceInput = await askUntilValid(rl, "<Цена?>: ", (value) => {
      const trimmed = value.trim();
      if (!/^\d{3,5}$/.test(trimmed)) {
        return "Введите корректную сумму из 3-5 цифр";
      }
      return true;
    });

    const price = Number(priceInput);

    const summary = `ищем в категории ${categoryName} ${brand} ${model} Цена ${price}`;
    console.log("\n" + summary);
    if (regexModelTxt) {
      console.log(regexModelTxt);
    }

    const confirm = await selectFromList(
      rl,
      "Подтвердите добавление",
      yesNoChoices
    );

    if (confirm !== "Да") {
      console.log("Запрос отменён пользователем");
      return;
    }

    const isObserved = await sendQuery({
      chatId,
      username: userName,
      category: categoryName,
      brand,
      model,
      price,
      modelRegex: regexModelTxt,
      modelRegexApply: regexForModel ? "Да" : "Нет",
    });

    if (isObserved) {
      console.log("Такой запрос уже выполняется");
    } else {
      console.log(
        `\n${categoryName} ${brand} ${model} - добавлен в список запросов`
      );
    }
  } catch (error) {
    console.error("Произошла ошибка при добавлении запроса", error);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

async function selectCategory(rl) {
  return await selectFromList(
    rl,
    "Выберите категорию",
    Object.keys(categories)
  );
}

async function selectBrand(rl, categoryName) {
  const options = brandOptionsByCategory[categoryName];
  if (!options) {
    throw new Error(`Неизвестная категория: ${categoryName}`);
  }

  while (true) {
    const selection = await selectFromList(rl, "Выберите бренд", options);
    if (selection === "Back") {
      console.log("Возврат к выбору категории\n");
      return null;
    }
    return selection;
  }
}

async function selectFromList(rl, title, options) {
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
      !Number.isNaN(byNumber) &&
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

async function askUntilValid(rl, question, validator) {
  while (true) {
    const answer = await rl.question(question);
    const validation = validator(answer);
    if (validation === true) {
      return answer.trim();
    }
    console.log(validation);
  }
}

async function sendQuery(data) {
  return await processQueryToDb({
    chatId: data.chatId.toString(),
    userName: data.username,
    category: categories[data.category],
    brand: data.brand,
    model: data.model,
    maxPrice: data.price,
    regex: allBrands[data.brand],
    regexModelTxt: data.modelRegex || undefined,
    regexForModel: data.modelRegexApply === "Да",
  });
}

main();
