export type SearchFocus = 'all' | 'academic' | 'writing' | 'youtube' | 'reddit';

export interface Source {
  title: string;
  url: string;
  snippet?: string;
  favicon?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Source[];
  relatedQuestions: string[];
  timestamp: string;
  focus: SearchFocus;
  proMode: boolean;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface SearchRequest {
  query: string;
  focus: SearchFocus;
  proMode: boolean;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface SearchResponse {
  answer: string;
  sources: Source[];
  relatedQuestions: string[];
}
