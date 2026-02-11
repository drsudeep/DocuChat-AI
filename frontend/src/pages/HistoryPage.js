import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/chat/history`);
      setHistory(response.data);
    } catch (error) {
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="history-page">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button 
            data-testid="back-to-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            className="bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-lg p-2 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Chat History</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center" data-testid="no-history-message">
            <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-600">No chat history yet. Start a conversation to see it here!</p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="history-list">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                data-testid={`history-item-${item.id}`}
              >
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">{new Date(item.created_at).toLocaleString()}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-slate-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>Question:</p>
                    <p className="text-slate-700" style={{ fontFamily: 'Inter, sans-serif' }}>{item.question}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="font-semibold text-slate-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>Answer:</p>
                    <p className="text-slate-700 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{item.answer}</p>
                  </div>
                </div>
                {item.sources && item.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Sources:</p>
                    <div className="space-y-2">
                      {item.sources.map((source, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-lg p-3 text-sm" data-testid={`history-source-${idx}`}>
                          <p className="font-medium text-slate-700 mb-1">{source.document}</p>
                          <p className="text-slate-600 text-xs">{source.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
