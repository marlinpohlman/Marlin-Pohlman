import React, { useRef } from 'react';
import { Upload, FileText, Trash2, ExternalLink, HardDrive, Info, CheckCircle2, FileType } from 'lucide-react';
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
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <CheckCircle2 className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl text-gray-900 tracking-tight">ISO 42001</h1>
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          AI Management System (AIMS) Implementation Assistant
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Google Drive Link Section */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-emerald-100 rounded-full opacity-20 blur-xl"></div>
          
          <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-2 text-sm relative z-10">
            <HardDrive className="w-4 h-4" />
            <span>Knowledge Base</span>
          </div>
          <p className="text-xs text-emerald-700 mb-3 relative z-10">
            Access the official ISO 42001 repository. Download these files and upload them below to begin:
          </p>
          
          <div className="space-y-1 mb-4 pl-1 relative z-10">
             {['ISO/IEC 42001:2023 Standard', 'Annex A Controls Matrix', 'Risk Assessment Template'].map((item, i) => (
               <div key={i} className="flex items-center gap-2 text-[10px] text-emerald-600">
                 <FileType className="w-3 h-3 opacity-70" />
                 <span>{item}</span>
               </div>
             ))}
          </div>

          <a 
            href={DRIVE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-white hover:bg-emerald-50 text-emerald-600 text-xs font-bold py-2.5 px-3 rounded-lg border border-emerald-200 transition-colors shadow-sm relative z-10"
          >
            Open Google Drive
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Upload Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Context Files</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${files.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
              {files.length} Active
            </span>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden" 
              accept="application/pdf,text/plain"
              multiple
            />
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-white group-hover:scale-110 transition-all">
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Upload Documents</p>
            <p className="text-xs text-gray-400 mt-1">PDFs Recommended</p>
          </div>

          <div className="mt-4 space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-gray-700 font-medium truncate max-w-[120px]" title={file.name}>{file.name}</span>
                    <span className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                  </div>
                </div>
                <button 
                  onClick={() => onRemove(file.id)}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {files.length === 0 && (
               <div className="flex gap-2 p-3 text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                 <Info className="w-4 h-4 flex-shrink-0 text-gray-400" />
                 <p>No context loaded. Responses will be based on general AI knowledge.</p>
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