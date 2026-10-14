export interface ColumnMeta {
  name: string;
  type: string;
}

export interface QueryResult {
  columns: ColumnMeta[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    description: string;
    isPrimary?: boolean;
    isForeign?: boolean;
  }[];
}

export interface ExplanationOption {
  id: string;
  label: string;
  description: string;
}
