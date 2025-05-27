import { ParserPrompt } from "constants/prompts/parser.prompt";
import { Dota2RuParser } from "parsers/dota2-ru.parser";
import { DeepseekService } from "services/deepseek.service";
import { DotesportsParser } from "parsers/dotesports.parser";

export const PostService = {
  generate: async (): Promise<{
    title: string;
    text: string;
    imageUrl: string;
  }> => {
    console.log("Генерирую пост");
    // const { content, imageUrl } = await Dota2RuParser.parse();
    const { content, imageUrl } = await DotesportsParser.parse();
    if (content && imageUrl) {
      const { title, text } = await DeepseekService.use(
        `${ParserPrompt} HTML:${content}`,
      );
      return { title, text, imageUrl };
    }

    return { title: "", text: "", imageUrl: "" };
  },
};
