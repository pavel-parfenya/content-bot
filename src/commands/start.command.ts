import { Context } from "grammy";

export default async function startCommand(ctx: Context) {
  await ctx.reply(
    "Привет! Напиши мне новость или команду для генерации поста.",
  );
}
