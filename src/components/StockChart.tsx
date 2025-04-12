
import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { Stock, StockPrice } from '@/services/StockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StockChartProps {
  stock: Stock;
}

const StockChart: React.FC<StockChartProps> = ({ stock }) => {
  const [timeframe, setTimeframe] = useState<'7d' | '1m' | '3m' | '1y'>('1m');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  
  // Format the date for display
  const formatData = (data: StockPrice[]): any[] => {
    // Filter data based on timeframe
    let filteredData = [...data];
    const currentDate = new Date();
    
    if (timeframe === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(currentDate.getDate() - 7);
      filteredData = data.filter(item => new Date(item.date) >= sevenDaysAgo);
    } else if (timeframe === '1m') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(currentDate.getMonth() - 1);
      filteredData = data.filter(item => new Date(item.date) >= oneMonthAgo);
    } else if (timeframe === '3m') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
      filteredData = data.filter(item => new Date(item.date) >= threeMonthsAgo);
    }
    
    return filteredData.map(item => ({
      date: item.date,
      close: item.close,
      open: item.open,
      volume: item.volume / 1000000, // Convert to millions for display
    }));
  };

  const chartData = formatData(stock.prices);
  const isPositive = stock.change >= 0;
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold">
            {stock.name} ({stock.symbol})
          </h2>
          <p className="text-lg">
            ${stock.price.toFixed(2)}
            <span className={`ml-2 ${isPositive ? 'text-stock-up' : 'text-stock-down'}`}>
              {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="bg-gray-100 rounded-md p-1">
            <button 
              className={`px-3 py-1 rounded-md text-sm ${timeframe === '7d' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}
              onClick={() => setTimeframe('7d')}
            >
              7D
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${timeframe === '1m' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}
              onClick={() => setTimeframe('1m')}
            >
              1M
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${timeframe === '3m' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}
              onClick={() => setTimeframe('3m')}
            >
              3M
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${timeframe === '1y' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}
              onClick={() => setTimeframe('1y')}
            >
              1Y
            </button>
          </div>
          
          <div className="bg-gray-100 rounded-md p-1">
            <button 
              className={`px-3 py-1 rounded-md text-sm ${chartType === 'area' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}
              onClick={() => setChartType('area')}
            >
              Area
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${chartType === 'bar' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}
              onClick={() => setChartType('bar')}
            >
              Volume
            </button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="price" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="price">Price</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
        </TabsList>
        
        <TabsContent value="price" className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#4CAF50" : "#E53935"} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={isPositive ? "#4CAF50" : "#E53935"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString();
                }}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke={isPositive ? "#4CAF50" : "#E53935"} 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>
        
        <TabsContent value="volume" className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}M`, 'Volume']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString();
                }}
              />
              <Legend />
              <Bar dataKey="volume" fill="#8884d8" name="Volume (Million)" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockChart;
