'use client';

import React, { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isTyping?: boolean;
  timestamp?: Date;
};

export default function AIMChat() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: 'Dashboard Confessional Agent has signed on at ' + new Date().toLocaleTimeString(),
    sender: 'bot',
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AIM color palette
  const aimColors = {
    background: '#F0F0F0',
    titleBar: '#316FCE',
    titleBarText: '#FFFFFF',
    buddyList: '#E0E0E0',
    buddyHover: '#D0D0D0',
    messageArea: '#FFFFFF',
    userMessageBg: '#FFE6F2',
    botMessageBg: '#E6F2FF',
    inputBorder: '#A0A0A0',
    buttonBg: '#316FCE',
    buttonHover: '#2558A8',
    buttonText: '#FFFFFF',
    statusBar: '#E0E0E0',
    statusText: '#000000',
    typingIndicator: '#A0A0A0'
  };

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      text, 
      sender, 
      timestamp: new Date() 
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    // Add user message
    const userMessage = inputValue.trim();
    addMessage(userMessage, 'user');
    setInputValue('');
    setIsProcessing(true);

    try {
      // Show typing indicator
      const typingId = Date.now().toString();
      setMessages(prev => [...prev, { 
        id: typingId, 
        text: '...', 
        sender: 'bot', 
        isTyping: true 
      }]);

      // Call the API
      const response = await fetch('/api/analyze-feelings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingId));

      if (!response.ok) {
        throw new Error('Failed to analyze feelings');
      }

      const data = await response.json();
      
      if (data.song) {
        addMessage(`I found a song that might resonate with you: "${data.song}"`, 'bot');
        addMessage(`Themes: ${data.themes.join(', ')}`, 'bot');
      } else {
        addMessage("I'm having trouble finding the perfect song right now. Could you tell me more about how you're feeling?", 'bot');
      }
      
      // Show try again prompt
      setShowTryAgain(true);
      
    } catch (error) {
      console.error('Error:', error);
      addMessage("I'm having trouble connecting to the music agent. Please try again later.", 'bot');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTryAgain = () => {
    setShowTryAgain(false);
    addMessage("I'm ready to help you find another song. How are you feeling today?", 'bot');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-200 p-4">
      {/* Main Window */}
      <div className="flex-1 flex flex-col bg-white border-2 border-gray-400 rounded-t-lg overflow-hidden shadow-lg">
        {/* Title Bar */}
        <div 
          className="flex items-center justify-between p-2 text-white font-bold"
          style={{ backgroundColor: aimColors.titleBar }}
        >
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2">Dashboard Confessional Agent</span>
          </div>
          <div className="text-xs">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Buddy List */}
          <div 
            className="w-48 border-r border-gray-300 p-2 hidden md:block overflow-y-auto"
            style={{ backgroundColor: aimColors.buddyList }}
          >
            <div className="font-bold text-sm mb-2 pb-1 border-b border-gray-400">Buddies (1/1)</div>
            <div 
              className="p-2 rounded hover:bg-gray-300 cursor-pointer flex items-center"
              style={{ backgroundColor: aimColors.buddyHover }}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">Dashboard Bot</span>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div 
              className="flex-1 p-4 overflow-y-auto"
              style={{ backgroundColor: aimColors.messageArea }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 max-w-3/4 ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}
                >
                  <div 
                    className={`inline-block p-2 rounded-lg text-sm ${message.sender === 'user' 
                      ? 'bg-blue-100 rounded-tr-none' 
                      : 'bg-gray-100 rounded-tl-none'}`}
                  >
                    <div className="font-bold text-xs text-gray-500">
                      {message.sender === 'user' ? 'You' : 'Dashboard Bot'}
                      <span className="ml-2 text-gray-400">
                        {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {message.isTyping ? (
                      <div className="flex space-x-1 p-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <div className="mt-1">{message.text}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-300 p-2 bg-gray-100">
              {showTryAgain ? (
                <div className="flex justify-center p-2">
                  <button
                    onClick={handleTryAgain}
                    className="px-4 py-1 text-sm rounded border border-gray-400 bg-white hover:bg-gray-200"
                    style={{ color: aimColors.buttonText, backgroundColor: aimColors.buttonBg }}
                  >
                    Try Another Song
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How are you feeling today?"
                    className="flex-1 p-2 border border-gray-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                    className="px-4 py-1 text-sm rounded border border-gray-400 bg-white hover:bg-gray-200"
                    style={{ 
                      color: aimColors.buttonText, 
                      backgroundColor: !inputValue.trim() || isProcessing ? '#CCCCCC' : aimColors.buttonBg,
                      cursor: (!inputValue.trim() || isProcessing) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isProcessing ? '...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div 
          className="text-xs p-1 border-t border-gray-300 flex justify-between"
          style={{ backgroundColor: aimColors.statusBar, color: aimColors.statusText }}
        >
          <span>Dashboard Confessional Agent</span>
          <span>1 buddy online | {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
