import { getPool } from "db/pool";
import { qualifiedTable } from "db/schema";

const NEWS = qualifiedTable("news");

export const NewsStore = {
  getAll: async (): Promise<string[]> => {
    const { rows } = await getPool().query<{ title: string }>(
      `SELECT title FROM ${NEWS} ORDER BY id ASC`,
    );
    return rows.map((r) => r.title);
  },

  add: async (title: string): Promise<void> => {
    const result = await getPool().query(
      `INSERT INTO ${NEWS} (title) VALUES ($1) ON CONFLICT (title) DO NOTHING`,
      [title],
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log("Заголовок добавлен: ", title);
    } else {
      console.log("Заголовок уже существует.");
    }
  },
};
