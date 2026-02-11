import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { FileText, Upload, MessageSquare, LogOut, History, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      toast.error('Only PDF and TXT files are supported');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully!');
      await fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await axios.delete(`${API}/documents/${docId}`);
      toast.success('Document deleted');
      await fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-page">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>DocuChat AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              data-testid="nav-chat-btn"
              onClick={() => navigate('/chat')}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            <Button 
              data-testid="nav-history-btn"
              onClick={() => navigate('/history')}
              className="bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-lg px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <Button 
              data-testid="nav-logout-btn"
              onClick={handleLogout}
              className="bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-lg px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }} data-testid="dashboard-heading">
              Your Documents
            </h1>
            <p className="text-lg text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Welcome back, {user?.full_name}
            </p>
          </div>

          <div
            {...getRootProps()}
            data-testid="upload-dropzone"
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 mb-8 cursor-pointer ${
              isDragActive ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                <p className="text-lg text-slate-700 font-medium">Processing your document...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-blue-50 rounded-full p-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-lg text-slate-700 font-medium">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop a file here, or click to select'}
                </p>
                <p className="text-sm text-slate-500">Supports PDF and TXT files (max 10MB)</p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center" data-testid="no-documents-message">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600">No documents yet. Upload your first document to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="documents-grid">
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  data-testid={`document-card-${doc.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <Button
                      data-testid={`delete-document-${doc.id}`}
                      onClick={() => handleDelete(doc.id)}
                      className="bg-transparent text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-2 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {doc.filename}
                  </h3>
                  <div className="space-y-1 text-sm text-slate-500">
                    <p>{(doc.file_size / 1024).toFixed(1)} KB</p>
                    <p>{doc.chunk_count} chunks</p>
                    <p>{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
