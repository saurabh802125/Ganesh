
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';
import { Stock, StockService } from '@/services/StockData';
import { AuthService } from '@/services/AuthService';
import { useToast } from "@/components/ui/use-toast";

interface StockCardProps {
  stock: Stock;
  onSelect?: (stock: Stock) => void;
  refreshWatchlist?: () => void;
}

const StockCard: React.FC<StockCardProps> = ({ 
  stock, 
  onSelect,
  refreshWatchlist
}) => {
  const isPositive = stock.change >= 0;
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const checkWatchlist = async () => {
      if (AuthService.isAuthenticated()) {
        const watchlist = await AuthService.getWatchlist();
        setIsInWatchlist(watchlist.includes(stock.symbol));
      }
    };
    
    checkWatchlist();
  }, [stock.symbol]);
  
  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!AuthService.isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to manage your watchlist",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isInWatchlist) {
        await AuthService.removeFromWatchlist(stock.symbol);
        setIsInWatchlist(false);
        toast({
          title: "Removed from watchlist",
          description: `${stock.symbol} has been removed from your watchlist.`,
        });
      } else {
        await AuthService.addToWatchlist(stock.symbol);
        setIsInWatchlist(true);
        toast({
          title: "Added to watchlist",
          description: `${stock.symbol} has been added to your watchlist.`,
        });
      }
      
      if (refreshWatchlist) {
        refreshWatchlist();
      }
    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div 
      className="stock-card cursor-pointer transition-all duration-200 hover:shadow-lg"
      onClick={() => onSelect && onSelect(stock)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{stock.symbol}</h3>
            <button 
              onClick={handleWatchlistToggle}
              className={`p-1 rounded-full hover:bg-gray-100 ${isLoading ? 'opacity-50' : ''}`}
              disabled={isLoading}
            >
              <Star 
                className={`w-4 h-4 ${isInWatchlist ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} 
              />
            </button>
          </div>
          <p className="text-sm text-gray-600">{stock.name}</p>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-bold">${stock.price.toFixed(2)}</p>
          <div className={`flex items-center text-sm ${isPositive ? 'text-stock-up' : 'text-stock-down'}`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 w-4 mr-1" />
            )}
            <span>{StockService.formatPriceChange(stock.change)}</span>
            <span className="ml-1">({StockService.formatPercentChange(stock.changePercent)})</span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <span>Market Cap: {StockService.formatMarketCap(stock.marketCap)}</span>
        <span>Sector: {stock.sector}</span>
      </div>
    </div>
  );
};

export default StockCard;
