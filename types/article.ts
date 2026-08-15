export interface Vocabulary {
  id: string;
  word: string;
  meaning: string | null;
  pronunciation?: string | null;
  example?: string | null;
  exampleTranslation?: string | null;
  partOfSpeech?: string | null;
  difficulty?: string | null;
}

export interface ArticleWord {
  id: string;
  word: string;
  meaning: string | null;
}

export interface ArticleSentence {
  id: string;
  english: string;
  translation: string | null;
  order: number;
  words?: ArticleWord[];
}

export interface ArticleParagraph {
  id?: string;
  english: string;
  translation?: string | null;
  order?: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  translation: string | null;

  /**
   * 文章词汇。
   *
   * 有些页面（例如长篇阅读详情页）
   * 查询文章时不会同时返回 vocabulary，
   * 所以这里必须允许为空。
   */
  vocabulary?: Vocabulary[];

  /**
   * 文章句子。
   */
  sentences?: ArticleSentence[];

  /**
   * 段落数据。
   */
  paragraphs?: ArticleParagraph[];

  /**
   * 兼容文章类型中的其他可选信息。
   */
  level?: string | null;
  category?: string | null;
  source?: string | null;
  author?: string | null;
  audioUrl?: string | null;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}