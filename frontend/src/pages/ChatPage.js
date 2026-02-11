import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MessageSquare, Send, FileText, ArrowLeft, Loader2, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    if (documents.length === 0) {
      toast.error('Please upload documents first');
      return;
    }

    const userMessage = { role: 'user', content: question };
    setMessages([...messages, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        question: question,
        document_ids: null
      });

      const botMessage = {
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get response');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="chat-page">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              data-testid="back-to-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-lg p-2 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Chat</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText className="h-4 w-4" />
            <span>{documents.length} documents</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-6 py-8" data-testid="chat-messages">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center" data-testid="chat-welcome-message">
              <div className="bg-blue-50 rounded-full p-6 mb-4">
                <MessageSquare className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Ask me anything
              </h2>
              <p className="text-slate-600 max-w-md" style={{ fontFamily: 'Inter, sans-serif' }}>
                I'll search through your uploaded documents to find the best answer
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`chat-message-${index}`}
                >
                  {message.role === 'assistant' && (
                    <div className="bg-blue-100 rounded-full p-2 mt-1">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-5 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200 shadow-sm'
                      }`}
                    >
                      <p className="leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {message.content}
                      </p>
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-slate-500 font-medium">Sources:</p>
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm" data-testid={`source-${idx}`}>
                            <p className="font-medium text-slate-700 mb-1">{source.document}</p>
                            <p className="text-slate-600 text-xs">{source.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="bg-slate-200 rounded-full p-2 mt-1">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-3"
                  data-testid="chat-loading"
                >
                  <div className="bg-blue-100 rounded-full p-2 mt-1">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm px-5 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="flex gap-3" data-testid="chat-input-form">
            <Input
              data-testid="chat-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={loading || documents.length === 0}
              className="flex-1 bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all"
            />
            <Button
              type="submit"
              data-testid="chat-send-btn"
              disabled={loading || !question.trim() || documents.length === 0}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 py-2 font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </form>
          {documents.length === 0 && (
            <p className="text-sm text-slate-500 mt-2 text-center">Upload documents first to start chatting</p>
          )}
        </div>
      </div>
    </div>
  );
}
