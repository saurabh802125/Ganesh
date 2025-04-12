
import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Stock, StockService } from '@/services/StockData';

interface MarketOverviewProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ stocks, onSelectStock }) => {
  // Calculate market summary values
  const topGainers = StockService.getTopGainers(3);
  const topLosers = StockService.getTopLosers(3);
  
  // Calculate market indices (fake ones for demonstration)
  const marketIndices = [
    {
      name: "StockVision 500",
      value: 4892.37,
      change: 12.54,
      changePercent: 0.26,
    },
    {
      name: "Tech Composite",
      value: 15632.74,
      change: -78.23,
      changePercent: -0.5,
    },
    {
      name: "SV 30",
      value: 34876.19,
      change: 167.45,
      changePercent: 0.48,
    }
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Market Indices */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">Market Indices</h2>
        <div className="space-y-4">
          {marketIndices.map(index => (
            <div key={index.name} className="flex justify-between items-center border-b pb-2 last:border-b-0">
              <div>
                <h3 className="font-semibold">{index.name}</h3>
              </div>
              <div className="text-right">
                <p className="font-bold">{index.value.toFixed(2)}</p>
                <div className={`flex items-center ${index.changePercent >= 0 ? 'text-stock-up' : 'text-stock-down'}`}>
                  {index.changePercent >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  <span>{StockService.formatPriceChange(index.change)}</span>
                  <span className="ml-1">({StockService.formatPercentChange(index.changePercent)})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-stock-up" />
            <h2 className="text-lg font-bold">Top Gainers</h2>
          </div>
          <div className="space-y-3">
            {topGainers.map(stock => (
              <div 
                key={stock.symbol} 
                className="flex justify-between items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectStock(stock)}
              >
                <div>
                  <h3 className="font-medium">{stock.symbol}</h3>
                  <p className="text-xs text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${stock.price.toFixed(2)}</p>
                  <p className="text-sm text-stock-up">
                    +{stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Losers */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-stock-down" />
            <h2 className="text-lg font-bold">Top Losers</h2>
          </div>
          <div className="space-y-3">
            {topLosers.map(stock => (
              <div 
                key={stock.symbol} 
                className="flex justify-between items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectStock(stock)}
              >
                <div>
                  <h3 className="font-medium">{stock.symbol}</h3>
                  <p className="text-xs text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${stock.price.toFixed(2)}</p>
                  <p className="text-sm text-stock-down">
                    {stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
