import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { useCustomerStore } from '../../store/useCustomerStore';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { DishDetailModal } from '../../components/customer/DishDetailModal';
import { MenuItem } from '../../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  recommendedDishes?: MenuItem[];
}

export const DineAIPage: React.FC = () => {
  const { restaurant } = useCustomerStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [allDishes, setAllDishes] = useState<MenuItem[]>([]);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (restaurant?.id) {
      api.get(`/menu?restaurantId=${restaurant.id}`).then((res) => {
        setAllDishes(res.data);
      });
    }
  }, [restaurant?.id]);

  useEffect(() => {
    const initMsg: ChatMessage = {
      id: 'init-1',
      sender: 'ai',
      text: `Good evening! I am Dine AI, your personal culinary concierge at ${
        restaurant?.name || 'Aurelian'
      }. How may I curate your gastronomy experience tonight?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recommendedDishes: allDishes.filter((d) => d.isChefPick).slice(0, 2),
    };
    setMessages([initMsg]);
  }, [restaurant?.name, allDishes.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = [
    'What is the Chef’s signature recommendation?',
    'Show me vegetarian gluten-free dishes',
    'Best wine pairing for pasta',
    'Something light under ₹500',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const q = text.toLowerCase();
      let responseText = "Chef Marcus has prepared extraordinary selections for this evening's service.";
      let matchedDishes: MenuItem[] = [];

      if (q.includes('vegetarian') || q.includes('veg')) {
        responseText =
          'For exquisite vegetarian gastronomy, I highly recommend our Apulian Heirloom Burrata (₹580) and our handcrafted Tartufo Nero Wild Mushroom Pizza (₹680).';
        matchedDishes = allDishes.filter((d) => d.dietaryType === 'veg' || d.dietaryType === 'vegan').slice(0, 3);
      } else if (q.includes('wine') || q.includes('pair') || q.includes('drink')) {
        responseText =
          'Our Sommelier suggests the 2018 Barolo Reserve DOCG for robust meats, and the Chablis Premier Cru to accompany fresh seafood and pasta.';
        matchedDishes = allDishes.filter((d) => d.category?.name.includes('Cellar') || d.name.includes('Barolo') || d.name.includes('Chablis')).slice(0, 2);
      } else if (q.includes('chef') || q.includes('signature') || q.includes('recommend') || q.includes('popular')) {
        responseText =
          'Tonight’s crown jewel is the A5 Miyazaki Wagyu Ribeye alongside our handmade Truffle Mushroom Pasta (₹420).';
        matchedDishes = allDishes.filter((d) => d.isChefPick).slice(0, 2);
      } else if (q.includes('dessert') || q.includes('sweet')) {
        responseText =
          'Our master pastry chef recommends the Valrhona Dark Chocolate Sphere (₹420), melted tableside with warm espresso ganache.';
        matchedDishes = allDishes.filter((d) => d.category?.name.includes('Desserts')).slice(0, 2);
      } else {
        responseText = `Here are some of our most celebrated dishes crafted especially for tonight's service at ${
          restaurant?.name || 'Aurelian'
        }.`;
        matchedDishes = allDishes.slice(0, 2);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedDishes: matchedDishes,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#121414] text-[#e3e2e2] pb-36 pt-16 flex flex-col">
      <CustomerHeader title="Dine AI Assistant" showBack />

      <main className="flex-1 max-w-xl mx-auto px-4 sm:px-6 pt-4 flex flex-col justify-between w-full">
        {/* Assistant Header Avatar */}
        <div className="flex flex-col items-center justify-center text-center pb-4 pt-1">
          <div className="relative w-16 h-16 mb-2">
            <div className="absolute inset-0 rounded-full border border-[#edbf7b] opacity-40 animate-ping" />
            <img
              src="https://lh3.googleusercontent.com/aida/AP1WRLsO6BPElCozo2V7_csVjgwhrQTS78Pc7TU-vALE2AAQfD2g7RfV8jQvcBm4LufroQd5dockDyjE_mCfJOQ2Zsv9bQMBu-A8ZXTbfAF74eLuOYBiLaCU-8R4kw95sNw4hOcuuHOJzRwD3KtAY8efPbmJuQEH_tSwW11FIwRzXEa9ibuzUChXTEo8M1p5Oy5uAUpOzuI3cTr9W51zG8vPgjLZZmZDmym_tD-Pc5J1dBwCrb1iu-bd819Piw8"
              alt="Dine AI Avatar"
              className="w-full h-full object-cover rounded-full shadow-lg relative z-10 border-2 border-[#edbf7b]/60"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#edbf7b] rounded-full flex items-center justify-center z-20 shadow-md">
              <span className="material-symbols-outlined text-[#442b00] text-[12px] font-bold">auto_awesome</span>
            </div>
          </div>
          <h2 className="font-serif-heading text-lg font-bold text-[#edbf7b]">Dine AI Concierge</h2>
          <p className="text-[11px] text-[#d2c4b4]/60">Intelligent Culinary Sommelier</p>
        </div>

        {/* Message Thread */}
        <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {msg.sender === 'ai' && (
                  <span className="material-symbols-outlined text-[#edbf7b] text-[14px]">auto_awesome</span>
                )}
                <span className="text-[10px] text-[#d2c4b4]/50">
                  {msg.sender === 'ai' ? 'Dine AI' : 'You'} • {msg.time}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[88%] text-xs sm:text-sm leading-relaxed shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#343535] text-[#e3e2e2] rounded-tr-none'
                    : 'bg-[#1f2020] text-[#e3e2e2] rounded-tl-none border border-[#edbf7b]/25 relative overflow-hidden'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#edbf7b]/50 to-transparent" />
                )}
                <p>{msg.text}</p>

                {msg.recommendedDishes && msg.recommendedDishes.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[#4f4539]/30 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#edbf7b]">
                      Recommended Pairings:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.recommendedDishes.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => setSelectedDish(dish)}
                          className="p-2 rounded-xl bg-[#121414] border border-[#4f4539]/30 hover:border-[#edbf7b]/50 flex items-center gap-2.5 cursor-pointer transition-all group"
                        >
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-11 h-11 rounded-lg object-cover bg-[#1f2020]"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-serif-heading text-xs font-semibold text-[#e3e2e2] group-hover:text-[#edbf7b] truncate">
                              {dish.name}
                            </p>
                            <p className="text-[11px] font-bold text-[#edbf7b] mt-0.5">
                              ₹{dish.price.toFixed(2)}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-[#edbf7b] text-[16px] group-hover:scale-110 transition-transform">
                            add_circle
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[#1f2020] border border-[#4f4539]/30 w-16">
              <span className="w-1.5 h-1.5 rounded-full bg-[#edbf7b] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#edbf7b] animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#edbf7b] animate-bounce [animation-delay:300ms]" />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 py-2 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-[#1f2020] border border-[#4f4539]/40 text-[#d2c4b4] hover:text-[#edbf7b] hover:border-[#edbf7b]/50 text-[11px] font-medium transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <div className="relative flex items-center mb-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Dine AI anything about our dishes & drinks..."
            className="w-full h-12 bg-[#1f2020] rounded-xl pl-4 pr-12 text-xs sm:text-sm text-[#e3e2e2] placeholder-[#d2c4b4]/40 border border-[#4f4539]/40 focus:outline-none focus:border-[#edbf7b]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="absolute right-2 w-8 h-8 rounded-lg bg-[#edbf7b] disabled:opacity-40 text-[#442b00] flex items-center justify-center shadow-md transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </main>

      <CustomerBottomNav />
      <DishDetailModal item={selectedDish} onClose={() => setSelectedDish(null)} />
    </div>
  );
};
