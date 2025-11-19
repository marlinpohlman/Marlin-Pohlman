import React, { useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  error: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  setInput,
  onSend,
  isStreaming,
  error
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Custom renderer for ReactMarkdown to styling
  const MarkdownComponents = {
    p: ({node, ...props}: any) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc ml-6 mb-4 space-y-1" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal ml-6 mb-4 space-y-1" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold mb-3 mt-5 text-gray-800" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-800" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-semibold text-gray-900" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-blue-200 pl-4 py-1 my-4 bg-blue-50 rounded-r text-gray-700 italic" {...props} />,
    code: ({node, inline, className, children, ...props}: any) => {
      return inline ? (
        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      ) : (
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4 overflow-x-auto">
          <code className="text-sm font-mono" {...props}>
            {children}
          </code>
        </div>
      );
    },
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header for Mobile */}
      <div className="md:hidden p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-20">
        <h1 className="font-bold text-lg text-gray-900">ISO 42001 AI</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center text-gray-500 space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How can I help with ISO 42001?</h2>
              <p className="max-w-md text-gray-600">
                Upload your standard documents from the sidebar to get specific answers, or ask me general questions about the AI Management System framework.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mt-6">
                {[
                  "What is the scope of ISO 42001?",
                  "Explain the AI risk assessment process.",
                  "What are the mandatory clauses?",
                  "How do I define an AI system?"
                ].map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(q)}
                    className="p-3 text-sm text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-100'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col max-w-[85%] md:max-w-[75%] min-w-[100px] ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`px-6 py-4 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 rounded-tl-sm'
                }`}>
                   {msg.isThinking ? (
                     <div className="flex items-center gap-2 text-gray-400 text-sm">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span>Analyzing documents...</span>
                     </div>
                   ) : (
                     <div className={`prose ${msg.role === 'user' ? 'prose-invert' : 'prose-gray'} max-w-none text-sm md:text-base`}>
                        {/* Use a simple markdown renderer or pre-wrap */}
                        <ReactMarkdown components={MarkdownComponents as any}>
                          {msg.text}
                        </ReactMarkdown>
                     </div>
                   )}
                </div>
                <span className="text-[10px] text-gray-400 mt-2 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about ISO 42001..."
            rows={1}
            className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none shadow-inner text-gray-800 placeholder-gray-400 max-h-[200px]"
            disabled={isStreaming}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2.5 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          AI can make mistakes. Please verify important clauses in the official standard.
        </p>
      </div>
    </div>
  );
};