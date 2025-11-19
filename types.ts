export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 string
  size: number;
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
}