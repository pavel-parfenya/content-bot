export enum PostTemplate {
  Classic = "Classic",
  Alt = "Alt",
  /** Публикация с исходным изображением без HTML-шаблона. */
  None = "None",
}

export function postTemplateLabel(t: PostTemplate): string {
  switch (t) {
    case PostTemplate.Classic:
      return "Классика";
    case PostTemplate.Alt:
      return "Фон";
    case PostTemplate.None:
      return "Без шаблона";
  }
}
