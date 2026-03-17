export interface ArticleItem {
  title: string;
  description: string | null;
  author: string | null;
  imageUrl: string | null;
  originalUrl: string;
  readTime: string | null;
  publishedAt: Date | null;
}

export interface CompanyConfig {
  name: string;
  slug: string;
  logo: string;
  website: string;
  blogUrl: string;
  feedUrl: string | null;
  feedType: "rss" | "atom" | "scrape";
  color: string;
}

export interface ScrapeResult {
  company: string;
  articlesFound: number;
  articlesNew: number;
  errors: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
