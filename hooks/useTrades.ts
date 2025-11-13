
import { useState, useEffect } from 'react';
import { Trade } from '../types';

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const savedTrades = localStorage.getItem('trades');
      return savedTrades ? JSON.parse(savedTrades) : [];
    } catch (error) {
      console.error("Error reading trades from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('trades', JSON.stringify(trades));
    } catch (error) {
      console.error("Error saving trades to localStorage", error);
    }
  }, [trades]);

  const addTrade = (tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: new Date().toISOString() + Math.random(), // more unique id
    };
    setTrades(prevTrades => [...prevTrades, newTrade].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const deleteTrade = (id: string) => {
    setTrades(prevTrades => prevTrades.filter(trade => trade.id !== id));
  };

  return { trades, addTrade, deleteTrade };
};
