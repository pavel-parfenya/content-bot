import { ParserPrompt } from "constants/prompts/parser.prompt";
import { Source } from "constants/source";
import { Dota2RuParser } from "parsers/dota2-ru.parser";
import { DeepseekService } from "services/deepseek.service";
import { DotesportsParser } from "parsers/dotesports.parser";

const getContent = async (source: Source) => {
  switch (source) {
    case Source.Dota2Ru:
      return await Dota2RuParser.parse();
    case Source.Dotesports:
      return await DotesportsParser.parse();
  }
};

export const PostService = {
  generate: async (
    source = Source.Dotesports,
  ): Promise<{
    title: string;
    text: string;
    imageUrl: string;
  }> => {
    console.log("Генерирую пост");
    const { content, imageUrl } = await getContent(source);

    if (content && imageUrl) {
      const { title, text } = await DeepseekService.use(
        `${ParserPrompt} HTML:${content}`,
      );
      return { title, text, imageUrl };
    }

    return { title: "", text: "", imageUrl: "" };
  },
};
