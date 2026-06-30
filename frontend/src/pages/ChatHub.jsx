import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { getSocket, initSocket } from '../services/socket';
import { useApp } from '../contexts/AppContext';
import { MessageSquare, Send, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatHub = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loadingChats, setLoadingChats] = useState(true);

  const messagesEndRef = useRef(null);
  const { user, showToast } = useApp();
  const navigate = useNavigate();

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const data = await api.get('/chats');
      setChats(data);
    } catch (err) {
      showToast(err.message || 'Failed to load conversations.', 'error');
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchChats();
    const activeSocket = getSocket() || initSocket();
    setSocket(activeSocket);

    return () => {
      // Clean up listeners
      if (activeSocket) {
        activeSocket.off('receive_message');
      }
    };
  }, [user]);

  // Handle active socket listener for selected chat
  useEffect(() => {
    if (!socket || !activeChat) return;

    // Join room
    socket.emit('join_chat', { chatId: activeChat.id });

    // Listen for new messages
    socket.on('receive_message', (message) => {
      if (message.chatId === activeChat.id) {
        setMessages((prev) => [...prev, message]);
      }
      // Update last message in chats list
      fetchChats();
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket, activeChat]);

  // Scroll to bottom when message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    try {
      const data = await api.get(`/chats/${chat.id}/messages`);
      setMessages(data);
    } catch (err) {
      showToast(err.message || 'Failed to load message history.', 'error');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeChat) return;

    socket.emit('send_message', {
      chatId: activeChat.id,
      messageText: newMessage
    });

    setNewMessage('');
  };

  const getPartnerName = (chat) => {
    if (!chat) return '';
    return chat.buyerId === user.id ? chat.seller.fullName : chat.buyer.fullName;
  };

  const getPartnerRoom = (chat) => {
    if (!chat) return '';
    return chat.buyerId === user.id ? chat.seller.roomNumber : chat.buyer.roomNumber;
  };

  return (
    <div className="glass-panel" style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      height: 'calc(100vh - 220px)',
      minHeight: '480px',
      overflow: 'hidden',
      animation: 'fadeIn 0.4s ease'
    }}>
      {/* Left Column: Conversations List */}
      <div style={{
        borderRight: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid var(--border-glass)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
          <span>Active Chats</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No conversations active. Browse the Marketplace or Runners board to start a conversation!
            </div>
          ) : (
            chats.map((chat) => {
              const isSelected = activeChat && activeChat.id === chat.id;
              const lastMsg = chat.messages && chat.messages[0];
              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                      {getPartnerName(chat)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Room {getPartnerRoom(chat)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {lastMsg ? lastMsg.messageText : 'Start chatting...'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Messages Area */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(9, 13, 22, 0.2)' }}>
        {activeChat ? (
          <>
            {/* Header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(17, 24, 39, 0.4)'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{getPartnerName(activeChat)}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Regent Home Room {getPartnerRoom(activeChat)}
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {messages.map((msg) => {
                const isOwn = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      background: isOwn ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.06)',
                      color: isOwn ? '#000' : 'var(--text-primary)',
                      padding: '0.75rem 1rem',
                      borderRadius: isOwn ? '12px 12px 0 12px' : '12px 12px 12px 0',
                      border: isOwn ? 'none' : '1px solid var(--border-glass)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ fontSize: '0.9rem', wordBreak: 'break-word', fontWeight: isOwn ? 500 : 400 }}>
                        {msg.messageText}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: isOwn ? 'rgba(0, 0, 0, 0.5)' : 'var(--text-muted)',
                        textAlign: 'right',
                        marginTop: '0.35rem'
                      }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-glass)',
              background: 'rgba(17, 24, 39, 0.4)',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <MessageSquare size={48} style={{ marginBottom: '1rem' }} />
            <h3>No conversation selected</h3>
            <p style={{ fontSize: '0.85rem' }}>Select a room on the left side menu to start chatting with your neighbor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHub;
