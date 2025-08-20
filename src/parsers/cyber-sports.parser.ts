import { Parser } from "parsers/parser";

export const cyberSportsParser = new Parser(
  "https://cyber.sports.ru/dota2/",
  "main.columns-layout__main article a.material-list__item-img-link",
  ".material-list__title a",
  ".post-content",
  false,
);
