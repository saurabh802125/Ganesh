
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MarketOverview from '@/components/MarketOverview';
import StockChart from '@/components/StockChart';
import StockList from '@/components/StockList';
import WatchlistComponent from '@/components/WatchlistComponent';
import StockSearch from '@/components/StockSearch';
import CSVUpload from '@/components/CSVUpload';
import { Stock, StockService } from '@/services/StockData';
import { ApiStockService } from '@/services/ApiStockService';
import { useToast } from '@/components/ui/use-toast';
import AuthModal from '@/components/auth/AuthModal';
import UserMenu from '@/components/auth/UserMenu';
import { AuthService } from '@/services/AuthService';

const Index = () => {
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoading(true);
      try {
        // Try to get stocks from the API
        const apiStocks = await ApiStockService.getStocks();
        
        if (apiStocks.length > 0) {
          setAllStocks(apiStocks);
          setFilteredStocks(apiStocks);
          
          if (apiStocks.length > 0) {
            setSelectedStock(apiStocks[0]);
          }
        } else {
          // Use mock data as fallback
          const mockStocks = StockService.getStocks();
          setAllStocks(mockStocks);
          setFilteredStocks(mockStocks);
          
          if (mockStocks.length > 0) {
            setSelectedStock(mockStocks[0]);
          }
          
          toast({
            title: "Using mock data",
            description: "Could not connect to the API. Using mock data instead.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching stocks:', error);
        
        // Use mock data as fallback
        const stocks = StockService.getStocks();
        setAllStocks(stocks);
        setFilteredStocks(stocks);
        
        if (stocks.length > 0) {
          setSelectedStock(stocks[0]);
        }
        
        toast({
          title: "Connection error",
          description: "Could not connect to the API. Using mock data instead.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStocks();
  }, [toast]);
  
  useEffect(() => {
    if (searchTerm) {
      const results = StockService.searchStocks(searchTerm);
      setFilteredStocks(results);
    } else {
      setFilteredStocks(allStocks);
    }
  }, [searchTerm, allStocks]);
  
  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    
    // Scroll to chart section for mobile users
    const chartSection = document.getElementById('chart-section');
    if (chartSection && window.innerWidth < 768) {
      chartSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };
  
  const handleAddToWatchlist = async (stock: Stock) => {
    if (!AuthService.isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to add stocks to your watchlist",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await ApiStockService.addToWatchlist(stock.symbol);
      
      toast({
        title: "Added to watchlist",
        description: `${stock.symbol} has been added to your watchlist.`,
      });
      
      // Trigger a refresh of the watchlist
      const event = new CustomEvent('watchlist-changed');
      window.dispatchEvent(event);
    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-stock-blue-dark text-white py-2 px-4 flex justify-end space-x-2">
        {AuthService.isAuthenticated() ? <UserMenu /> : <AuthModal />}
      </div>
      
      <Header onSearch={handleSearch} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-8">
          <MarketOverview stocks={allStocks} onSelectStock={handleStockSelect} />
        </section>
        
        <section id="chart-section" className="mb-8">
          {selectedStock && <StockChart stock={selectedStock} />}
        </section>
        
        <section className="mb-8">
          <CSVUpload />
        </section>
        
        <section id="watchlist" className="mb-8">
          <WatchlistComponent onSelectStock={handleStockSelect} />
        </section>
        
        <section id="stocks" className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Discover Stocks</h2>
          <StockSearch 
            stocks={allStocks}
            onFilteredStocks={setFilteredStocks}
          />
          <StockList 
            stocks={filteredStocks} 
            title="All Stocks" 
            onSelectStock={handleStockSelect}
            refreshWatchlist={() => {
              // This will trigger the watchlist component to reload
              const event = new CustomEvent('watchlist-changed');
              window.dispatchEvent(event);
            }}
          />
        </section>
      </main>
      
      <footer className="bg-stock-blue-dark text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">StockVision</h2>
              <p className="text-sm text-gray-300">Dynamic stock market analysis</p>
            </div>
            <div className="text-sm text-gray-300">
              <p>© 2025 StockVision. All rights reserved.</p>
              <p>Using sample data for demonstration purposes.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
