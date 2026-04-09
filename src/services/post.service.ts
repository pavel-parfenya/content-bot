import { ParserPrompt } from "constants/prompts/parser.prompt";
import { Source } from "constants/source";
import { cyberSportsParser } from "parsers/cyber-sports.parser";
import { cyberSportParser } from "parsers/cybersport.parser";
import { dota2RuParser } from "parsers/dota2-ru.parser";
import { hawkLiveParser } from "parsers/hawk-live.parser";
import { DeepseekService } from "services/deepseek.service";

const getContent = async (source: Source) => {
  switch (source) {
    case Source.Dota2Ru:
      return await dota2RuParser.parse();
    case Source.CyberSportsParser:
      return await cyberSportsParser.parse();
    case Source.CyberSportParser:
      return await cyberSportParser.parse();
    case Source.HawkLive:
      return await hawkLiveParser.parse();
  }
};

export type GeneratePostResult = {
  title: string;
  text: string;
  imageUrl: string;
  /** Не удалось подобрать уникальную новость за MAX_NEWS_PICK_ATTEMPTS попыток. */
  newsNotFound?: boolean;
};

export const PostService = {
  generate: async (
    source = Source.CyberSportParser,
  ): Promise<GeneratePostResult> => {
    console.log("Генерирую пост");
    const parsed = await getContent(source);

    if (parsed.newsNotFound) {
      return {
        title: "",
        text: "",
        imageUrl: "",
        newsNotFound: true,
      };
    }

    const { content, imageUrl } = parsed;

    if (content && imageUrl) {
      const { title, text } = await DeepseekService.use(
        `${ParserPrompt} HTML:${content}`,
      );
      return { title, text, imageUrl };
    }

    return { title: "", text: "", imageUrl: "" };
  },
};
