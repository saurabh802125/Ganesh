
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sectors, Stock, StockService } from '@/services/StockData';
import StockCard from './StockCard';

interface StockListProps {
  stocks: Stock[];
  title: string;
  onSelectStock: (stock: Stock) => void;
  refreshWatchlist?: () => void;
}

const StockList: React.FC<StockListProps> = ({ 
  stocks, 
  title, 
  onSelectStock,
  refreshWatchlist
}) => {
  const [sortBy, setSortBy] = useState<string>('symbol');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  
  // Apply sorting
  const sortedStocks = [...stocks].sort((a, b) => {
    switch (sortBy) {
      case 'symbol':
        return a.symbol.localeCompare(b.symbol);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'priceAsc':
        return a.price - b.price;
      case 'priceDesc':
        return b.price - a.price;
      case 'changeAsc':
        return a.changePercent - b.changePercent;
      case 'changeDesc':
        return b.changePercent - a.changePercent;
      case 'marketCapDesc':
        return b.marketCap - a.marketCap;
      default:
        return 0;
    }
  });
  
  // Apply sector filter
  const filteredStocks = sectorFilter === 'all' 
    ? sortedStocks 
    : sortedStocks.filter(stock => stock.sector === sectorFilter);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
        
        <div className="flex flex-wrap gap-2">
          <Select 
            value={sectorFilter} 
            onValueChange={setSectorFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {sectors.map(sector => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={sortBy} 
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="symbol">Symbol (A-Z)</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="priceAsc">Price (Low to High)</SelectItem>
              <SelectItem value="priceDesc">Price (High to Low)</SelectItem>
              <SelectItem value="changeAsc">% Change (Low to High)</SelectItem>
              <SelectItem value="changeDesc">% Change (High to Low)</SelectItem>
              <SelectItem value="marketCapDesc">Market Cap (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredStocks.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No stocks found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map(stock => (
            <StockCard 
              key={stock.symbol} 
              stock={stock} 
              onSelect={onSelectStock}
              refreshWatchlist={refreshWatchlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StockList;
