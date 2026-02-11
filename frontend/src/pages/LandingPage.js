import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, FileText, Search, Lock, Zap, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Upload Documents',
      description: 'Support for PDF and TXT files with instant processing'
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: 'Semantic Search',
      description: 'AI-powered search across your entire knowledge base'
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Intelligent Chat',
      description: 'Get answers from your documents with source citations'
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Fully Local',
      description: 'Your data never leaves your infrastructure'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Fast Processing',
      description: 'Instant embedding generation and retrieval'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure & Private',
      description: 'Bank-grade security with JWT authentication'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>DocuChat AI</span>
          </div>
          <Button 
            data-testid="nav-get-started-btn"
            onClick={() => navigate('/auth')}
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 py-2 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Get Started
          </Button>
        </div>
      </nav>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 py-24 text-center"
      >
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6"
          style={{ fontFamily: 'Manrope, sans-serif' }}
          data-testid="hero-heading"
        >
          Your Documents,
          <br />
          <span className="text-blue-600">Smarter Answers</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
          Upload your documents and ask questions. Get instant, accurate answers powered by local AI with complete privacy.
        </p>
        <div className="flex gap-4 justify-center">
          <Button 
            data-testid="hero-get-started-btn"
            onClick={() => navigate('/auth')}
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-8 py-3 font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Start Free
          </Button>
          <Button 
            data-testid="hero-learn-more-btn"
            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            className="bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-lg px-8 py-3 font-medium text-base transition-all duration-200"
          >
            Learn More
          </Button>
        </div>
      </motion.section>

      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <img 
            src="https://images.pexels.com/photos/3716540/pexels-photo-3716540.jpeg" 
            alt="Abstract technology"
            className="w-full h-96 object-cover rounded-2xl shadow-lg"
          />
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 
            className="text-3xl font-bold text-slate-900 text-center mb-16 tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif' }}
            data-testid="features-heading"
          >
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                data-testid={`feature-card-${index}`}
              >
                <div className="bg-blue-50 text-blue-600 rounded-lg p-3 inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Join thousands of users who trust DocuChat AI for their knowledge management
          </p>
          <Button 
            data-testid="cta-get-started-btn"
            onClick={() => navigate('/auth')}
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-8 py-3 font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          <p style={{ fontFamily: 'Inter, sans-serif' }}>© 2025 DocuChat AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
