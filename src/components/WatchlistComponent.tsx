
import React, { useState, useEffect } from 'react';
import { Stock, StockService } from '@/services/StockData';
import { AuthService } from '@/services/AuthService';
import { ApiStockService } from '@/services/ApiStockService';
import StockList from './StockList';
import { Pencil, Save, X, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from './auth/AuthModal';

interface WatchlistProps {
  onSelectStock: (stock: Stock) => void;
}

const WatchlistComponent: React.FC<WatchlistProps> = ({ onSelectStock }) => {
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadWatchlist = async () => {
    setIsLoading(true);
    if (AuthService.isAuthenticated()) {
      try {
        const symbols = await AuthService.getWatchlist();
        const stocksData = await ApiStockService.getStocks();
        const watchlistData = stocksData.filter(stock => symbols.includes(stock.symbol));
        setWatchlistStocks(watchlistData);
      } catch (error) {
        console.error('Error loading watchlist:', error);
        setWatchlistStocks([]);
      }
    } else {
      setWatchlistStocks([]);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadWatchlist();
    
    // Set up event listener for authentication changes
    const handleAuthChange = () => {
      loadWatchlist();
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);
  
  const handleLoginSuccess = () => {
    loadWatchlist();
  };
  
  const renderContent = () => {
    if (!AuthService.isAuthenticated()) {
      return (
        <div className="py-8 text-center text-gray-500">
          <p>You need to be logged in to see your watchlist.</p>
          <div className="mt-4">
            <AuthModal onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="py-8 text-center text-gray-500">
          <p>Loading your watchlist...</p>
        </div>
      );
    }
    
    if (watchlistStocks.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500">
          <p>Your watchlist is empty.</p>
          <p className="mt-2 text-sm">Add stocks to your watchlist by clicking the star icon on stock cards.</p>
        </div>
      );
    }
    
    if (isEditing) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistStocks.map(stock => (
            <div key={stock.symbol} className="stock-card flex justify-between items-center">
              <div>
                <h3 className="font-bold">{stock.symbol}</h3>
                <p className="text-sm text-gray-600">{stock.name}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={async () => {
                  await AuthService.removeFromWatchlist(stock.symbol);
                  loadWatchlist();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <StockList 
        stocks={watchlistStocks} 
        title="" 
        onSelectStock={onSelectStock} 
        refreshWatchlist={loadWatchlist}
      />
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Watchlist</h2>
        
        {AuthService.isAuthenticated() && watchlistStocks.length > 0 && (
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(false)}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Done
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
};

export default WatchlistComponent;
