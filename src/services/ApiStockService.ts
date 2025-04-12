
import { Stock, StockPrice } from './StockData';
import { AuthService } from './AuthService';

const API_URL = 'http://localhost:5000/api';

export const ApiStockService = {
  async getStocks(): Promise<Stock[]> {
    try {
      const response = await fetch(`${API_URL}/stocks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stocks');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching stocks:', error);
      return [];
    }
  },
  
  async getStockBySymbol(symbol: string): Promise<Stock | null> {
    try {
      const response = await fetch(`${API_URL}/stocks/${symbol}`);
      
      if (!response.ok) {
        throw new Error('Stock not found');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching stock ${symbol}:`, error);
      return null;
    }
  },
  
  async addToWatchlist(symbol: string): Promise<boolean> {
    try {
      await AuthService.addToWatchlist(symbol);
      return true;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  },
  
  async removeFromWatchlist(symbol: string): Promise<boolean> {
    try {
      await AuthService.removeFromWatchlist(symbol);
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  },
  
  async getWatchlist(): Promise<string[]> {
    return AuthService.getWatchlist();
  },
  
  async uploadCSV(file: File): Promise<{count: number}> {
    const token = AuthService.getToken();
    
    if (!token) {
      throw new Error('You must be logged in to upload data');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/stocks/upload`, {
      method: 'POST',
      headers: {
        'x-auth-token': token,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Upload failed');
    }
    
    return await response.json();
  }
};
