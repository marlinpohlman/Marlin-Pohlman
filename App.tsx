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
      // Reset chat when context changes to ensure the model "sees" the new files in a fresh session or re-injected context
      // For simplicity in this demo, we reset the session logic but keep UI messages if preferred, 
      // but technically RAG works best if the session knows the context from the start.
      // We will trigger a session reset in the service.
      resetChatSession();
      
      // Optional: Add a system message to UI indicating context updated
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          role: 'model', 
          text: `**System Update:** I've added ${newFiles.length} new document(s) to my context. I'm ready to answer questions about them.`, 
          timestamp: Date.now() 
        }
      ]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    resetChatSession();
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
          ? { ...msg, text: "I encountered an error processing your request. Please check your connection or API key.", isThinking: false } 
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