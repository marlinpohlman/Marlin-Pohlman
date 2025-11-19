import React, { useRef } from 'react';
import { Upload, FileText, Trash2, ExternalLink, HardDrive, Info } from 'lucide-react';
import { UploadedFile } from '../types';

interface SidebarProps {
  files: UploadedFile[];
  onUpload: (files: FileList) => void;
  onRemove: (id: string) => void;
}

const DRIVE_LINK = "https://drive.google.com/drive/folders/1pQwoScbpZZSXMxgUcGx8covUoTk4MFDa?usp=drive_link";

export const Sidebar: React.FC<SidebarProps> = ({ files, onUpload, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 hidden md:flex">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <FileText className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl text-gray-900 tracking-tight">ISO 42001 AI</h1>
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Your specialist assistant for the AI Management System standard.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Google Drive Link Section */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2 text-sm">
            <HardDrive className="w-4 h-4" />
            <span>Knowledge Source</span>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            Access the official document repository. Download files and upload them here to chat.
          </p>
          <a 
            href={DRIVE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-white hover:bg-blue-50 text-blue-600 text-xs font-medium py-2 px-3 rounded-lg border border-blue-200 transition-colors shadow-sm"
          >
            Open Google Drive
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Upload Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Context Files</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{files.length}</span>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
            />
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-white group-hover:scale-110 transition-all">
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Click to upload</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT</p>
          </div>

          <div className="mt-4 space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-gray-700 font-medium truncate" title={file.name}>{file.name}</span>
                    <span className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button 
                  onClick={() => onRemove(file.id)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {files.length === 0 && (
               <div className="flex gap-2 p-3 text-xs text-amber-700 bg-amber-50 rounded-lg border border-amber-100">
                 <Info className="w-4 h-4 flex-shrink-0" />
                 <p>Upload documents to give the AI knowledge about ISO 42001.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 text-[10px] text-center text-gray-400">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};