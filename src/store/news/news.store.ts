import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export const NewsStore = {
  add: (title: string) => {
    const filePath = path.resolve(__dirname, "news.json");

    let data: string[];
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, "utf-8");
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error("Ошибка при чтении JSON:", e);
        data = [];
      }
    } else {
      data = [];
    }

    if (!data.includes(title)) {
      data.push(title);
      writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log("Заголовок добавлен: ", title);
    } else {
      console.log("Заголовок уже существует.");
    }
  },

  getAll: () => {
    const filePath = path.resolve(__dirname, "news.json");

    if (!existsSync(filePath)) {
      console.warn(
        "Файл usedNewsTitles.json не найден. Возвращаю пустой массив.",
      );
      return [];
    }

    try {
      const raw = readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Ошибка при чтении или парсинге JSON:", e);
      return [];
    }
  },
};
