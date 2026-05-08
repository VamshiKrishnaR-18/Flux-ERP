import React, { useState } from 'react';
import { Paperclip, Trash2, Download, Loader2, Plus } from 'lucide-react';
import { api } from '../lib/axios';
import { toast } from 'sonner';

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt?: string | Date;
}

interface AttachmentListProps {
  attachments: Attachment[];
  onUpdate: (attachments: Attachment[]) => Promise<void>;
  isLoading?: boolean;
}

export function AttachmentList({ attachments, onUpdate, isLoading: parentLoading }: AttachmentListProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        const newAttachment: Attachment = data.data;
        await onUpdate([...attachments, newAttachment]);
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    await onUpdate(newAttachments);
    toast.success('Attachment removed');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments
        </h3>
        <label className="cursor-pointer bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shadow-sm">
          {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add File
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading || parentLoading} />
        </label>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-gray-400 dark:text-slate-500">No attachments yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {attachments.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 transition-colors group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800">
                  <Paperclip className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 uppercase">{formatSize(file.size)} • {file.type.split('/')[1]}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={`${api.defaults.baseURL?.replace('/api/v1', '')}${file.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => handleDelete(idx)}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
