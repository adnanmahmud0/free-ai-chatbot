"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
    content: string;
    role: "user" | "bot" | "system" | "assistant";
    meta?: string;
}

interface ChatSession {
    _id: string;
    title: string;
}

export default function Home() {
    const threadRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    // Fetch list of chats on mount
    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/chats');
            const data = await res.json();
            if (Array.isArray(data)) {
                setChats(data);
                if (data.length > 0 && !currentChatId) {
                    loadChat(data[0]._id);
                }
            } else {
                console.error("Failed to fetch chats, received:", data);
                setChats([]);
            }
        } catch (error) {
            console.error("Failed to fetch chats:", error);
            setChats([]);
        }
    };

    const loadChat = async (id: string) => {
        try {
            setCurrentChatId(id);
            const res = await fetch(`/api/chats/${id}`);
            const data = await res.json();
            setMessages(data.messages || []);
        } catch (error) {
            console.error("Failed to load chat:", error);
        }
    };

    const handleNewChat = async () => {
        try {
            const res = await fetch('/api/chats', { method: 'POST' });
            const data = await res.json();
            setChats([data, ...chats]);
            setCurrentChatId(data._id);
            setMessages([]);
        } catch (error) {
            console.error("Failed to create new chat:", error);
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent loading the chat when clicking delete
        
        try {
            const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
            if (res.ok) {
                const newChats = chats.filter(c => c._id !== id);
                setChats(newChats);
                
                // If we deleted the active chat, clear the view or load another
                if (currentChatId === id) {
                    if (newChats.length > 0) {
                        loadChat(newChats[0]._id);
                    } else {
                        setCurrentChatId(null);
                        setMessages([]);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to delete chat:", error);
        }
    };

    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleDeleteMessage = async (indexToDelete: number) => {
        if (!currentChatId) return;
        
        const updatedMessages = messages.filter((_, idx) => idx !== indexToDelete);
        setMessages(updatedMessages); // Optimistic UI update
        
        try {
            const res = await fetch(`/api/chats/${currentChatId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages })
            });
            if (!res.ok) {
                console.error("Failed to delete message on server");
                // Revert if failed could be implemented here
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
        }
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        
        let activeChatId = currentChatId;
        
        // If no active chat, create one
        if (!activeChatId) {
            try {
                const res = await fetch('/api/chats', { method: 'POST' });
                const data = await res.json();
                activeChatId = data._id;
                setCurrentChatId(activeChatId);
                setChats([data, ...chats]);
            } catch (error) {
                console.error("Failed to create chat before sending:", error);
                return;
            }
        }
        
        const newMsg: Message = { content: text, role: "user", meta: "YOU · JUST NOW" };
        const newMessages = [...messages, newMsg];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);
        
        try {
            const apiMessages = newMessages.map(m => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content
            }));

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    chatId: activeChatId, 
                    messages: apiMessages,
                    newUserMessage: newMsg 
                })
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            
            setMessages(prev => [...prev, { 
                content: data.reply || "No response received.", 
                role: "bot", 
                meta: data.meta
            }]);
            
            // Refresh chats list to update title if changed
            fetchChats();
        } catch (error) {
            console.error("Failed to fetch reply:", error);
            setMessages(prev => [...prev, { 
                content: "Sorry, I lost connection to the server.", 
                role: "bot", 
                meta: "SYSTEM · ERROR" 
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="badge">
                    <svg viewBox="0 0 64 64" fill="none">
                        <path d="M8 46 L24 18 L32 32 L40 14 L56 46 Z" stroke="#232C34" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
                        <circle cx="32" cy="32" r="1.6" fill="#C9531E" />
                    </svg>
                </div>
                <div className="brand">TRAILHEAD<span>TRAIL ASSISTANT</span></div>
                <hr className="divider" />
                
                <div className="sidebar-scroll">
                    <button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
                    
                    <div className="chat-list-heading">PAST LOGS</div>
                    <ul className="chat-list">
                        {(Array.isArray(chats) ? chats : []).map(chat => (
                            <li 
                                key={chat._id} 
                                className={chat._id === currentChatId ? 'active' : ''}
                                onClick={() => loadChat(chat._id)}
                            >
                                <span className="chat-title">{chat.title}</span>
                                <button 
                                    className="delete-chat-btn" 
                                    onClick={(e) => handleDeleteChat(e, chat._id)}
                                    title="Delete Log"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="elev-mini">
                    <div className="elev-mini-label">Route profile</div>
                    <svg viewBox="0 0 220 60" width="100%" height="60">
                        <polyline points="0,50 30,40 55,44 80,20 110,28 140,10 170,22 200,15 220,30" fill="none" stroke="#566F55" strokeWidth="2" />
                        <circle cx="140" cy="10" r="3" fill="#C9531E" />
                    </svg>
                </div>
            </aside>

            <main className="main">
                <div className="topbar">
                    <h1>Log — {chats.find(c => c._id === currentChatId)?.title || "New Session"}</h1>
                    <span className="mile">MI 3.2 / 8.0</span>
                </div>

                <div className="thread-wrap" id="thread" ref={threadRef}>
                    <div className="spine"></div>

                    {messages.length === 0 && !isTyping && (
                        <div className="msg bot">
                            <div className="marker"></div>
                            <div className="bubble">Start a new conversation!</div>
                            <div className="meta">SYSTEM</div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
                            <button 
                                className="delete-msg-btn" 
                                onClick={() => handleDeleteMessage(i)}
                                title="Delete Message"
                            >
                                ✕
                            </button>
                            <div className="marker"></div>
                            <div className="bubble">
                                <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                            </div>
                            <div className="meta">{msg.meta}</div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="msg bot" id="typing-indicator">
                            <div className="marker"></div>
                            <div className="bubble">
                                <div className="typing"><span></span><span></span><span></span></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="chips">
                    <div className="chip" onClick={() => handleSend("What's the weather doing later?")}>Weather ahead</div>
                    <div className="chip" onClick={() => handleSend("How steep is the next mile?")}>Next mile grade</div>
                    <div className="chip" onClick={() => handleSend("What should be in my pack for this?")}>Pack check</div>
                </div>

                <div className="input-row">
                    <input 
                        id="input" 
                        type="text" 
                        placeholder="Ask Trailhead…" 
                        autoComplete="off" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }}
                    />
                    <button id="send" onClick={() => handleSend(input)}>SEND</button>
                </div>
            </main>
        </div>
    );
}
