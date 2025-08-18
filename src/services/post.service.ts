import { ParserPrompt } from "constants/prompts/parser.prompt";
import { Source } from "constants/source";
import { cyberSportsParser } from "parsers/cyber-sports.parser";
import { cyberSportParser } from "parsers/cybersport.parser";
import { dota2RuParser } from "parsers/dota2-ru.parser";
import { DeepseekService } from "services/deepseek.service";

const getContent = async (source: Source) => {
  switch (source) {
    case Source.Dota2Ru:
      return await dota2RuParser.parse();
    case Source.CyberSportsParser:
      return await cyberSportsParser.parse();
    case Source.CyberSportParser:
      return await cyberSportParser.parse();
  }
};

export const PostService = {
  generate: async (
    source = Source.CyberSportParser,
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
