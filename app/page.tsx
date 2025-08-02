'use client';

import React, { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isTyping?: boolean;
  timestamp?: Date;
};

// Aqua color scheme for Mac OS X 10.2
const aquaColors = {
  titleBar: {
    background: 'linear-gradient(to bottom, #2D3D6B 0%, #0E1A40 100%)',
    text: '#FFFFFF',
    buttonRed: '#FF3B30',
    buttonYellow: '#FFCC00',
    buttonGreen: '#28CD41',
    titleFont: '13px "Lucida Grande", Arial, sans-serif',
  },
  window: {
    background: 'rgba(240, 240, 240, 0.9)',
    border: '1px solid #999',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  button: {
    background: 'linear-gradient(to bottom, #FDFDFD 0%, #E8E8E8 100%)',
    border: '1px solid #999',
    hover: 'linear-gradient(to bottom, #F5F5F5 0%, #D8D8D8 100%)',
    active: 'linear-gradient(to bottom, #E8E8E8 0%, #D0D0D0 100%)',
    text: '#000',
    disabled: '#E0E0E0',
  },
  input: {
    background: 'white',
    border: '1px solid #999',
    focusBorder: '1px solid #3B7CDE',
    focusShadow: '0 0 0 2px rgba(59, 124, 222, 0.3)',
  },
  message: {
    userBg: 'linear-gradient(to bottom, #5D8FF0 0%, #3B7CDE 100%)',
    botBg: 'linear-gradient(to bottom, #F8F8F8 0%, #E8E8E8 100%)',
    text: '#000',
    userText: '#FFF',
    timestamp: '#666',
  },
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
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Center window on mount and on window resize
  useEffect(() => {
    const centerWindow = () => {
      if (windowRef.current) {
        const windowWidth = windowRef.current.offsetWidth;
        const windowHeight = windowRef.current.offsetHeight;
        
        setWindowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
      }
    };

    // Center initially
    centerWindow();
    
    // Re-center on window resize
    window.addEventListener('resize', centerWindow);
    return () => window.removeEventListener('resize', centerWindow);
  }, []);

  // Dragging handlers for the window
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - windowPosition.x,
        y: e.clientY - windowPosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setWindowPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

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
        isTyping: true,
        timestamp: new Date()
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
        if (data.themes && data.themes.length > 0) {
          addMessage(`Themes: ${data.themes.join(', ')}`, 'bot');
        }
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
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        backgroundImage: 'url(/retro_desktop.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        backgroundColor: '#1E1E1E', // Fallback color
      }}
    >
      {/* Aqua Window */}
      <div 
        ref={windowRef}
        className="flex flex-col w-full max-w-2xl h-[600px] rounded-lg overflow-hidden shadow-2xl"
        style={{
          backgroundColor: aquaColors.window.background,
          border: aquaColors.window.border,
          borderRadius: aquaColors.window.borderRadius,
          boxShadow: aquaColors.window.boxShadow,
          position: 'fixed',
          left: windowPosition.x,
          top: windowPosition.y,
          transform: 'translate(-50%, -50%)',
          cursor: isDragging ? 'grabbing' : 'default',
          transition: isDragging ? 'none' : 'all 0.3s ease',
          zIndex: 1000,
          width: '100%',
          maxWidth: '42rem',
          height: '600px'
        }}
      >
        {/* Title Bar */}
        <div 
          className="flex items-center justify-between px-4 py-1.5 select-none"
          style={{
            background: aquaColors.titleBar.background,
            color: aquaColors.titleBar.text,
            font: aquaColors.titleBar.titleFont,
            cursor: isDragging ? 'grabbing' : 'move',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: aquaColors.titleBar.buttonRed }}
              onClick={() => window.close()}
            ></div>
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: aquaColors.titleBar.buttonYellow }}
            ></div>
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: aquaColors.titleBar.buttonGreen }}
            ></div>
            <span className="ml-2 text-shadow">Dashboard Confessional Bot</span>
          </div>
          <div className="text-xs text-gray-300">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Buddy List */}
          <div 
            className="w-48 border-r border-gray-300 p-2 hidden md:block overflow-y-auto"
            style={{ backgroundColor: '#F0F0F0' }}
          >
            <div className="font-bold text-sm mb-2 pb-1 border-b border-gray-400 text-gray-700">
              Buddies (1/1)
            </div>
            <div 
              className="p-2 rounded hover:bg-blue-100 cursor-pointer flex items-center"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-800">Dashboard Bot</span>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div 
              className="flex-1 p-4 overflow-y-auto"
              style={{ backgroundColor: '#F8F8F8' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 max-w-[80%] ${
                    message.sender === 'user' ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  <div 
                    className={`p-3 rounded-2xl text-sm ${
                      message.sender === 'user'
                        ? 'text-white rounded-tr-sm'
                        : 'text-gray-800 rounded-tl-sm'
                    }`}
                    style={{
                      background: message.sender === 'user' 
                        ? aquaColors.message.userBg 
                        : aquaColors.message.botBg,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {message.isTyping ? (
                      <div className="flex space-x-1 p-2">
                        <div 
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" 
                          style={{ animationDelay: '0ms' }} 
                        />
                        <div 
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" 
                          style={{ animationDelay: '150ms' }} 
                        />
                        <div 
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" 
                          style={{ animationDelay: '300ms' }} 
                        />
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap">{message.text}</div>
                        <div 
                          className="text-xs mt-1" 
                          style={{
                            color: message.sender === 'user' 
                              ? 'rgba(255,255,255,0.7)' 
                              : aquaColors.message.timestamp,
                            textAlign: 'right',
                          }}
                        >
                          {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div 
              className="p-3 border-t border-gray-300"
              style={{ backgroundColor: '#E8E8E8' }}
            >
              {showTryAgain ? (
                <div className="flex justify-center p-2">
                  <button
                    onClick={handleTryAgain}
                    className="px-4 py-1.5 text-sm rounded-md border border-gray-400 hover:shadow-inner"
                    style={{
                      background: aquaColors.button.background,
                      border: aquaColors.button.border,
                      color: aquaColors.button.text,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = aquaColors.button.hover;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = aquaColors.button.background;
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.background = aquaColors.button.active;
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.background = aquaColors.button.hover;
                    }}
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
                    className="flex-1 p-2 border rounded-md focus:outline-none text-sm"
                    style={{
                      backgroundColor: aquaColors.input.background,
                      border: aquaColors.input.border,
                    }}
                    onFocus={(e) => {
                      e.target.style.border = aquaColors.input.focusBorder;
                      e.target.style.boxShadow = aquaColors.input.focusShadow;
                    }}
                    onBlur={(e) => {
                      e.target.style.border = aquaColors.input.border;
                      e.target.style.boxShadow = 'none';
                    }}
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                    className="px-4 py-1.5 text-sm rounded-md border border-gray-400 hover:shadow-inner"
                    style={{
                      background: !inputValue.trim() || isProcessing 
                        ? aquaColors.button.disabled 
                        : aquaColors.button.background,
                      border: aquaColors.button.border,
                      color: !inputValue.trim() || isProcessing 
                        ? '#888' 
                        : aquaColors.button.text,
                      cursor: !inputValue.trim() || isProcessing 
                        ? 'not-allowed' 
                        : 'pointer',
                      minWidth: '80px',
                    }}
                    onMouseOver={(e) => {
                      if (inputValue.trim() && !isProcessing) {
                        e.currentTarget.style.background = aquaColors.button.hover;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (inputValue.trim() && !isProcessing) {
                        e.currentTarget.style.background = aquaColors.button.background;
                      }
                    }}
                    onMouseDown={(e) => {
                      if (inputValue.trim() && !isProcessing) {
                        e.currentTarget.style.background = aquaColors.button.active;
                      }
                    }}
                    onMouseUp={(e) => {
                      if (inputValue.trim() && !isProcessing) {
                        e.currentTarget.style.background = aquaColors.button.hover;
                      }
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
          className="text-xs p-1 border-t border-gray-300 flex justify-between items-center"
          style={{
            backgroundColor: '#E0E0E0',
            color: '#333',
            height: '20px',
            fontSize: '11px',
          }}
        >
          <span>Dashboard Confessional Agent</span>
          <span>1 buddy online | {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
