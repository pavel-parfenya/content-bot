import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  waitingForPrompt?: boolean;
  generatedPost?: string | null;
  generatedImage?: Buffer<ArrayBufferLike> | null;
}

export type MyContext = Context & SessionFlavor<SessionData>;
