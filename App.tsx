import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { Message, UploadedFile } from './types';
import { sendMessageStream, resetChatSession } from './services/geminiService';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUpload = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      
      try {
        const base64Data = await base64Promise;
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data
        });
      } catch (err) {
        console.error("Error reading file", err);
        setError("Failed to read file. Please try again.");
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      // NOTE: We do NOT reset the chat session here. 
      // The service handles injecting new files into the existing session on the next message.
      
      // Add a visual indicator in the chat that files were added
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: 'system', 
          text: `_Uploaded ${newFiles.length} new file(s). They will be analyzed with your next question._`, 
          timestamp: Date.now() 
        }
      ]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    // We MUST reset the session when removing files because the model's context window 
    // still contains the old file data. There is no "un-read" API.
    resetChatSession();
    setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: 'system', 
          text: `_File removed. Chat context has been reset._`, 
          timestamp: Date.now() 
        }
      ]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);
    setError(null);

    // Create placeholder for model response
    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isThinking: true
    }]);

    try {
      const stream = sendMessageStream(userMsg.text, files);
      let fullText = '';

      for await (const textChunk of stream) {
        fullText += textChunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === modelMsgId 
              ? { ...msg, text: fullText, isThinking: false } 
              : msg
          )
        );
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "An error occurred while communicating with Gemini.");
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId 
          ? { ...msg, text: "I encountered an error processing your request. Please ensure your API key is valid and you are uploading supported file types (PDF recommended).", isThinking: false } 
          : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar Container */}
      <div className={`absolute top-0 left-0 h-full z-40 transition-transform duration-300 md:relative md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
         <Sidebar 
           files={files} 
           onUpload={handleUpload} 
           onRemove={handleRemoveFile} 
         />
         {/* Close button for mobile sidebar */}
         <button 
           onClick={() => setIsMobileMenuOpen(false)}
           className="absolute top-4 right-4 md:hidden p-2 bg-white rounded-full shadow-md text-gray-500"
         >
           <X className="w-5 h-5" />
         </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full">
        {/* Mobile Menu Trigger (Absolute to overlap ChatInterface header if needed, or integrated) */}
        <div className="md:hidden absolute top-4 left-4 z-20">
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
           >
             <Menu className="w-5 h-5" />
           </button>
        </div>

        <ChatInterface 
          messages={messages}
          input={inputValue}
          setInput={setInputValue}
          onSend={handleSendMessage}
          isStreaming={isStreaming}
          error={error}
        />
      </div>
    </div>
  );
};

export default App;