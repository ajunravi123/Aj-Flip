
export interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

export interface PageData {
  imageUrl: string;
  pageNumber: number;
  textContent: string;
  textItems: TextItem[];
  width: number;
  height: number;
}

export interface BookMetadata {
  title: string;
  author: string;
  totalPages: number;
}

export enum ReaderState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  READING = 'READING',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
