import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Copy, Users, Lock, MessageCircle, X, Download, File, Sun, Moon, Heart, RefreshCw, Reply, AtSign } from 'lucide-react';
import { useChat } from './hooks/useChat';
import { useTheme } from './contexts/ThemeContext';

const EMOJI_LIST = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'join' | 'create' | 'chat'>('welcome');
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; sender: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    currentRoom,
    messages,
    users,
    isConnected,
    error,
    refreshData,
    createRoom,
    joinRoom,
    sendMessage,
    updateTypingStatus,
    leaveRoom
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateRoom = async () => {
    if (nickname.trim()) {
      setIsLoading(true);
      try {
        await createRoom(nickname.trim());
        setCurrentScreen('chat');
      } catch (err) {
        console.error('Failed to create room:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleJoinRoom = async () => {
    if (pin.trim() && nickname.trim()) {
      setIsLoading(true);
      try {
        await joinRoom(pin.trim(), nickname.trim());
        setCurrentScreen('chat');
      } catch (err) {
        console.error('Failed to join room:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim() && currentRoom) {
      setSendingMessage(true);
      try {
        await sendMessage(currentMessage.trim(), nickname, 'text', undefined, undefined, replyingTo);
        setCurrentMessage('');
        setReplyingTo(null);
        await updateTypingStatus(nickname, false);
      } catch (err) {
        console.error('Failed to send message:', err);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentRoom) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSendingMessage(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const messageType = file.type.startsWith('image/') ? 'image' : 'file';
          await sendMessage(content, nickname, messageType, file.name, file.size, replyingTo);
          setReplyingTo(null);
        } catch (err) {
          console.error('Failed to send file:', err);
        } finally {
          setSendingMessage(false);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleEmojiSelect = (emoji: string) => {
    setCurrentMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const handleTyping = (value: string) => {
    setCurrentMessage(value);
    
    // Handle @mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.trim()) {
      updateTypingStatus(nickname, true);
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(nickname, false);
      }, 1000);
    } else {
      updateTypingStatus(nickname, false);
    }
  };

  const handleMentionSelect = (mentionedUser: string) => {
    const lastAtIndex = currentMessage.lastIndexOf('@');
    const newMessage = currentMessage.substring(0, lastAtIndex) + `@${mentionedUser} `;
    setCurrentMessage(newMessage);
    setShowMentions(false);
    messageInputRef.current?.focus();
  };

  const handleReply = (message: { id: string; content: string; sender: string }) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const copyPin = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.pin);
      alert('PIN copied to clipboard!');
    }
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    setCurrentScreen('welcome');
    setPin('');
    setCurrentMessage('');
    setReplyingTo(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const typingUsers = users.filter(user => user.isTyping && user.nickname !== nickname);
  const availableUsers = users.filter(user => user.nickname !== nickname);

  if (currentScreen === 'welcome') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' 
          : 'bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100'
      } flex items-center justify-center p-4`}>
        <div className={`backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border transition-all duration-500 animate-fade-in-scale ${
          isDark 
            ? 'bg-gray-800/80 border-gray-700/20' 
            : 'bg-white/80 border-white/20'
        }`}>
          {/* Theme Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                isDark 
                  ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30' 
                  : 'bg-purple-400/20 text-purple-600 hover:bg-purple-400/30'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-center mb-8">
            <div className={`rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse-glow ${
              isDark 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-gradient-to-r from-purple-400 to-pink-400'
            }`}>
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
              isDark 
                ? 'from-purple-400 to-pink-400' 
                : 'from-purple-600 to-pink-600'
            }`}>
              SecureChat
            </h1>
            <p className={`transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Ephemeral messaging with PIN security
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => setCurrentScreen('create')}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-bounce-gentle ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
              }`}
            >
              <Lock className="w-5 h-5" />
              Create New Room
            </button>
            
            <button
              onClick={() => setCurrentScreen('join')}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' 
                  : 'bg-gradient-to-r from-blue-400 to-teal-400 text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              Join Existing Room
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg animate-slide-up">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Attribution */}
          <div className="mt-8 text-center">
            <p className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Made with <Heart className="w-4 h-4 inline text-red-500 animate-pulse" /> by{' '}
              <a 
                href="https://googleit.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`font-medium hover:underline transition-colors duration-300 ${
                  isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                }`}
              >
                Tridip
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'create' || currentScreen === 'join') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' 
          : 'bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100'
      } flex items-center justify-center p-4`}>
        <div className={`backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border transition-all duration-500 animate-fade-in-scale ${
          isDark 
            ? 'bg-gray-800/80 border-gray-700/20' 
            : 'bg-white/80 border-white/20'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentScreen('welcome')}
              className={`transition-colors duration-300 ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
              disabled={isLoading}
            >
              ← Back
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                isDark 
                  ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30' 
                  : 'bg-purple-400/20 text-purple-600 hover:bg-purple-400/30'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="text-center mb-8">
            <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg ${
              isDark 
                ? 'bg-gradient-to-r from-teal-500 to-blue-500' 
                : 'bg-gradient-to-r from-teal-400 to-blue-400'
            }`}>
              {currentScreen === 'create' ? <Lock className="w-8 h-8 text-white" /> : <Users className="w-8 h-8 text-white" />}
            </div>
            <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              {currentScreen === 'create' ? 'Create Room' : 'Join Room'}
            </h2>
            <p className={`transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {currentScreen === 'create' ? 'Set up a secure chat room' : 'Enter room PIN to join'}
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className={`w-full px-4 py-3 rounded-xl border focus:ring-4 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-700/50 border-gray-600 focus:border-purple-400 focus:ring-purple-400/20 text-white placeholder-gray-400' 
                    : 'bg-white/50 border-gray-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder-gray-500'
                }`}
                maxLength={20}
                disabled={isLoading}
              />
            </div>
            
            {currentScreen === 'join' && (
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Room PIN
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character PIN"
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-4 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600 focus:border-blue-400 focus:ring-blue-400/20 text-white placeholder-gray-400' 
                      : 'bg-white/50 border-gray-200 focus:border-blue-400 focus:ring-blue-100 text-gray-900 placeholder-gray-500'
                  }`}
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>
            )}
            
            <button
              onClick={currentScreen === 'create' ? handleCreateRoom : handleJoinRoom}
              disabled={!nickname.trim() || (currentScreen === 'join' && !pin.trim()) || isLoading}
              className={`w-full py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isDark 
                  ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white' 
                  : 'bg-gradient-to-r from-teal-400 to-blue-400 text-white'
              }`}
            >
              {isLoading ? 'Loading...' : (currentScreen === 'create' ? 'Create Room' : 'Join Room')}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg animate-slide-up">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' 
        : 'bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100'
    } flex flex-col`}>
      {/* Fixed Header */}
      <div className={`backdrop-blur-sm border-b shadow-sm transition-all duration-500 sticky top-0 z-50 ${
        isDark 
          ? 'bg-gray-800/90 border-gray-700/20' 
          : 'bg-white/90 border-white/20'
      }`}>
        <div className="max-w-4xl mx-auto p-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full w-10 h-10 flex items-center justify-center ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-r from-purple-400 to-pink-400'
              }`}>
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  SecureChat
                </h1>
                <div className="flex items-center gap-2">
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    PIN: {currentRoom?.pin}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-xs transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {users.length} user{users.length !== 1 ? 's' : ''} online
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 ${
                  isDark 
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                    : 'bg-green-400/20 text-green-600 hover:bg-green-400/30'
                } ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30' 
                    : 'bg-purple-400/20 text-purple-600 hover:bg-purple-400/30'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button
                onClick={copyPin}
                className={`px-4 py-2 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2 ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' 
                    : 'bg-gradient-to-r from-blue-400 to-teal-400 text-white'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy PIN</span>
              </button>
              
              <button
                onClick={handleLeaveRoom}
                className={`px-4 py-2 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                    : 'bg-gradient-to-r from-red-400 to-pink-400 text-white'
                }`}
              >
                <span className="hidden sm:inline">Leave</span>
                <X className="w-4 h-4 sm:hidden" />
              </button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            {/* First Row: Logo, Title, Status, Users */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center ${
                  isDark 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : 'bg-gradient-to-r from-purple-400 to-pink-400'
                }`}>
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className={`font-bold text-sm transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    SecureChat
                  </h1>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {users.length} user{users.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Second Row: Action Buttons */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 ${
                  isDark 
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                    : 'bg-green-400/20 text-green-600 hover:bg-green-400/30'
                } ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                  isDark 
                    ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30' 
                    : 'bg-purple-400/20 text-purple-600 hover:bg-purple-400/30'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button
                onClick={copyPin}
                className={`flex-1 px-3 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' 
                    : 'bg-gradient-to-r from-blue-400 to-teal-400 text-white'
                }`}
              >
                <Copy className="w-4 h-4" />
                PIN: {currentRoom?.pin}
              </button>
              
              <button
                onClick={handleLeaveRoom}
                className={`p-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                    : 'bg-gradient-to-r from-red-400 to-pink-400 text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ...existing code... */}

      {/* Messages Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => {
            const isOwnMessage = message.sender === nickname;
            const isSystemMessage = message.sender === 'System';
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group ${
                  isOwnMessage ? 'animate-message-send' : 'animate-message-receive'
                }`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="relative max-w-xs lg:max-w-md">
                  {/* Reply Button - Desktop Hover (Right side for other users) */}
                  {!isSystemMessage && (
                    <button
                      onClick={() => handleReply({ id: message.id, content: message.content, sender: message.sender })}
                      className={`absolute ${isOwnMessage ? '-left-8' : '-right-8'} top-1/2 transform -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hidden md:block ${
                        isDark 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      <Reply className="w-3 h-3" />
                    </button>
                  )}

                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 ${
                      isOwnMessage
                        ? isDark 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                        : isSystemMessage
                        ? isDark 
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200' 
                          : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
                        : isDark 
                          ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white backdrop-blur-sm border border-blue-500/20' 
                          : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-gray-800 border border-blue-200/50'
                    }`}
                  >
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className={`mb-2 p-2 rounded-lg border-l-2 ${
                        isDark ? 'bg-white/10 border-white/30' : 'bg-black/10 border-black/30'
                      }`}>
                        <p className="text-xs opacity-70 font-medium">{message.replyTo.sender}</p>
                        <p className="text-xs opacity-60">{truncateText(message.replyTo.content, 50)}</p>
                      </div>
                    )}

                    {!isSystemMessage && !isOwnMessage && (
                      <p className="text-xs font-medium mb-1 opacity-70">{message.sender}</p>
                    )}
                    
                    {message.type === 'text' && (
                      <p className="break-words">{message.content}</p>
                    )}
                    
                    {message.type === 'image' && (
                      <div className="space-y-2">
                        <img 
                          src={message.content} 
                          alt="Shared image" 
                          className="rounded-lg max-w-full h-auto shadow-md"
                        />
                        {message.fileName && (
                          <p className="text-xs opacity-70">{message.fileName}</p>
                        )}
                      </div>
                    )}
                    
                    {message.type === 'file' && (
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${
                        isDark ? 'bg-white/10' : 'bg-white/20'
                      }`}>
                        <File className="w-8 h-8 opacity-70" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{message.fileName}</p>
                          <p className="text-xs opacity-70">{formatFileSize(message.fileSize || 0)}</p>
                        </div>
                        <button className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-white/10' : 'hover:bg-white/20'
                        }`}>
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs mt-2 opacity-70">{formatTime(message.timestamp)}</p>
                  </div>

                  {/* Reply Button - Mobile (Positioned based on message sender) */}
                  {!isSystemMessage && (
                    <button
                      onClick={() => handleReply({ id: message.id, content: message.content, sender: message.sender })}
                      className={`absolute ${isOwnMessage ? '-left-8' : '-right-8'} top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 hover:scale-110 md:hidden ${
                        isDark 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start animate-pulse">
              <div className={`px-4 py-3 rounded-2xl shadow-lg border transition-all duration-500 ${
                isDark 
                  ? 'bg-gray-700/80 backdrop-blur-sm border-gray-600/20 text-gray-300' 
                  : 'bg-white/80 backdrop-blur-sm border-white/20 text-gray-600'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${
                      isDark ? 'bg-gray-400' : 'bg-gray-400'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${
                      isDark ? 'bg-gray-400' : 'bg-gray-400'
                    }`} style={{animationDelay: '0.1s'}}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${
                      isDark ? 'bg-gray-400' : 'bg-gray-400'
                    }`} style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm">
                    {typingUsers.map(user => user.nickname).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`backdrop-blur-sm border-t transition-all duration-500 ${
          isDark 
            ? 'bg-gray-800/90 border-gray-700/20' 
            : 'bg-white/90 border-white/20'
        }`}>
          {/* Reply indicator */}
          {replyingTo && (
            <div className={`px-4 pt-3 border-b ${
              isDark ? 'border-gray-700/20' : 'border-gray-200/50'
            }`}>
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
              }`}>
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 opacity-70" />
                  <div>
                    <p className={`text-xs font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Replying to {replyingTo.sender}
                    </p>
                    <p className={`text-xs opacity-70 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {truncateText(replyingTo.content, 50)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className={`p-1 rounded-full transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={currentMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
                  placeholder="Type a message..."
                  className={`w-full px-4 py-3 pr-12 rounded-2xl border focus:ring-4 transition-all duration-300 resize-none ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600 focus:border-purple-400 focus:ring-purple-400/20 text-white placeholder-gray-400' 
                      : 'bg-white/50 border-gray-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder-gray-500'
                  }`}
                  disabled={!isConnected || sendingMessage}
                />
                
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  disabled={!isConnected || sendingMessage}
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected || sendingMessage}
                className={`p-3 rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  isDark 
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white' 
                    : 'bg-gradient-to-r from-teal-400 to-blue-400 text-white'
                }`}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || !isConnected || sendingMessage}
                className={`p-3 rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  sendingMessage ? 'animate-pulse' : ''
                } ${
                  isDark 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mentions Dropdown */}
            {showMentions && availableUsers.length > 0 && (
              <div className={`absolute bottom-20 left-4 right-4 rounded-2xl shadow-2xl border p-4 max-h-40 overflow-y-auto transition-all duration-500 ${
                isDark 
                  ? 'bg-gray-800/90 backdrop-blur-sm border-gray-700/20' 
                  : 'bg-white/90 backdrop-blur-sm border-white/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AtSign className="w-4 h-4 opacity-70" />
                  <h3 className={`font-medium text-sm transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    Mention User
                  </h3>
                </div>
                <div className="space-y-1">
                  {availableUsers.map((user, index) => (
                    <button
                      key={index}
                      onClick={() => handleMentionSelect(user.nickname)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                        isDark 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      @{user.nickname}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className={`absolute bottom-20 right-4 rounded-2xl shadow-2xl border p-4 max-w-xs w-80 max-h-60 overflow-y-auto transition-all duration-500 ${
                isDark 
                  ? 'bg-gray-800/90 backdrop-blur-sm border-gray-700/20' 
                  : 'bg-white/90 backdrop-blur-sm border-white/20'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-medium transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    Choose Emoji
                  </h3>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className={`transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-gray-300' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {EMOJI_LIST.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`text-xl rounded-lg p-2 transition-all duration-200 transform hover:scale-110 ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
