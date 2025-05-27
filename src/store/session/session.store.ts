import { SessionData } from "types";

class SessionStore {
  constructor(
    private readonly data: Map<string | number, SessionData | undefined>,
  ) {}

  public set(id: string | number, data: SessionData) {
    this.data.set(id, data);
  }

  public get(id: string | number) {
    return this.data.get(id);
  }

  public clear(id: string | number) {
    this.data.set(id, undefined);
  }
}

export default new SessionStore(new Map());
