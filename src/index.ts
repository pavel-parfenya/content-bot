import "dotenv/config";
import dotenv from "dotenv";
import { bot } from "bot";
dotenv.config();

(async () => {
  try {
    console.log("🚀 Запускаю бота...");
    await bot.start();
    console.log("✅ Бот успешно запущен!");
  } catch (err) {
    console.error("❌ Ошибка запуска:", err);
    process.exit(1);
  }
})();
