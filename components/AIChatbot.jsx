import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/geminiService';

const AIChatbot = ({ currentPlan }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: "Hi! I'm your AI Travel Designer. How can I help fine-tune your itinerary today?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        const newUserMessage = { id: Date.now(), sender: 'user', text: userText };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await chatWithAI(userText, currentPlan, messages);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: response }]);
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "Network error. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-3xl hover:bg-blue-700 transition-transform active:scale-95 z-[100] ${isOpen ? 'scale-0 translate-y-10' : 'scale-100 translate-y-0'}`}
            >
                💬
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-6 right-6 w-[350px] shadow-2xl rounded-3xl bg-white flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right z-[150] ${isOpen ? 'scale-100 opacity-100 h-[500px]' : 'scale-0 opacity-0 h-0 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-4 text-white flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur text-xl shadow-inner">
                            🤖
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg leading-tight">TravelMate Agent</h3>
                            <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-black uppercase tracking-widest">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-medium shadow-sm leading-relaxed ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100 z-10">
                    <form onSubmit={handleSend} className="relative">
                        <input
                            type="text"
                            placeholder="Ask about local food, places..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-full py-3.5 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md active:scale-95"
                        >
                            <svg className="w-5 h-5 -ml-1 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AIChatbot;
