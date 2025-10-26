export type QueryResult<T> = {
  items: T[];
  total: number;
};

export type SortByItem = {
  key: string;
  order?: boolean | "asc" | "desc";
};

export type PaginationArguments = {
  page: number;
  itemsPerPage: number;
  sortBy: SortByItem[];
};

export type TimeWindow = {
  start: string; // ISO date string
  end: string; // ISO date string
};
