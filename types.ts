export enum ItemType {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasItem {
  id: string;
  type: ItemType;
  content: string; // base64 for image/video, string for text
  audioContent?: string; // base64 for audio recording linked to a text item
  position: Position;
  size: Size;
  zIndex: number;
}

export interface JournalPage {
  id: string;
  date: string;
  items: CanvasItem[];
  previewImage?: string; // First image of the page for preview
}