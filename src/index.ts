import "dotenv/config";
import { bot } from "bot";
import { initDatabase } from "db/init";

(async () => {
  try {
    console.log("🚀 Запускаю бота...");
    await initDatabase();
    await bot.start();
    console.log("✅ Бот успешно запущен!");
  } catch (err) {
    console.error("❌ Ошибка запуска:", err);
    process.exit(1);
  }
})();
