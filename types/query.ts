export type QueryResult<T> = {
  items: T[];
  total: number;
};

export type SortByItem = {
  key: string;
  order?: boolean | "asc" | "desc";
};

export type QueryArguments = {
  page: number;
  itemsPerPage: number;
  sortBy: SortByItem[];
};
