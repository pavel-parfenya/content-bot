import { Parser } from "parsers/parser";

export const cyberSportParser = new Parser(
  "https://www.cybersport.ru",
  ".rounded-block > article > a",
  ".rounded-block article a h3",
  ".text-content",
  true,
  "/tags/dota-2",
);
