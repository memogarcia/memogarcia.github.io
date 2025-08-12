export interface Paragraph {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClipboardItem {
  id: string;
  content: string;
  note?: string;
  savedAt: Date;
  sourceParagraphId?: string;
  sourceDocumentId?: string;
}

export interface Document {
  id: string;
  title: string;
  paragraphs: Paragraph[];
  createdAt: Date;
  updatedAt: Date;
}

export type ToolTab = 'clipboard' | 'toc' | 'settings' | 'history';

export type EditorMode = 'edit' | 'preview' | 'focus';

export interface EditorSettings {
  fontFamily: string;
  fontSize: number;
}