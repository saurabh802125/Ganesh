
// Mock stock data for offline usage
export interface StockPrice {
  date: string;
  open: number;
  high: number;
  close: number;
  low: number;
  volume: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
  marketCap: number;
  prices: StockPrice[];
}

// Sample sectors for filtering
export const sectors = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Communication Services",
  "Energy",
  "Utilities",
  "Real Estate",
  "Consumer Defensive",
  "Industrials",
  "Basic Materials"
];

// Generate random historical prices
const generateHistoricalPrices = (
  basePrice: number,
  days: number = 30
): StockPrice[] => {
  const prices: StockPrice[] = [];
  let currentPrice = basePrice;
  
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Random price fluctuation between -3% and +3%
    const fluctuation = (Math.random() * 6 - 3) / 100;
    currentPrice = currentPrice * (1 + fluctuation);
    
    const open = currentPrice;
    const close = currentPrice * (1 + (Math.random() * 2 - 1) / 100);
    const high = Math.max(open, close) * (1 + Math.random() / 100);
    const low = Math.min(open, close) * (1 - Math.random() / 100);
    const volume = Math.floor(Math.random() * 10000000) + 500000;
    
    prices.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
  }
  
  return prices;
};

// Mock stock data
export const stocksData: Stock[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 174.79,
    change: 1.23,
    changePercent: 0.71,
    sector: "Technology",
    marketCap: 2850000000000,
    prices: generateHistoricalPrices(174.79)
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 338.11,
    change: -2.45,
    changePercent: -0.72,
    sector: "Technology",
    marketCap: 2520000000000,
    prices: generateHistoricalPrices(338.11)
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 137.12,
    change: 0.98,
    changePercent: 0.72,
    sector: "Communication Services",
    marketCap: 1740000000000,
    prices: generateHistoricalPrices(137.12)
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 127.74,
    change: -0.84,
    changePercent: -0.65,
    sector: "Consumer Cyclical",
    marketCap: 1300000000000,
    prices: generateHistoricalPrices(127.74)
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 238.83,
    change: 3.47,
    changePercent: 1.48,
    sector: "Consumer Cyclical",
    marketCap: 760000000000,
    prices: generateHistoricalPrices(238.83)
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    price: 294.37,
    change: -1.29,
    changePercent: -0.44,
    sector: "Communication Services",
    marketCap: 755000000000,
    prices: generateHistoricalPrices(294.37)
  },
  {
    symbol: "V",
    name: "Visa Inc.",
    price: 214.35,
    change: 2.13,
    changePercent: 1.00,
    sector: "Financial Services",
    marketCap: 445000000000,
    prices: generateHistoricalPrices(214.35)
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    price: 155.78,
    change: -0.47,
    changePercent: -0.30,
    sector: "Healthcare",
    marketCap: 405000000000,
    prices: generateHistoricalPrices(155.78)
  },
  {
    symbol: "WMT",
    name: "Walmart Inc.",
    price: 144.34,
    change: 1.05,
    changePercent: 0.73,
    sector: "Consumer Defensive",
    marketCap: 388000000000,
    prices: generateHistoricalPrices(144.34)
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    price: 146.77,
    change: -0.89,
    changePercent: -0.60,
    sector: "Financial Services",
    marketCap: 430000000000,
    prices: generateHistoricalPrices(146.77)
  },
  {
    symbol: "PG",
    name: "Procter & Gamble Co.",
    price: 152.96,
    change: 0.52,
    changePercent: 0.34,
    sector: "Consumer Defensive",
    marketCap: 360000000000,
    prices: generateHistoricalPrices(152.96)
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil Corporation",
    price: 104.80,
    change: -1.75,
    changePercent: -1.64,
    sector: "Energy",
    marketCap: 425000000000,
    prices: generateHistoricalPrices(104.80)
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 407.13,
    change: 9.45,
    changePercent: 2.38,
    sector: "Technology",
    marketCap: 1006000000000,
    prices: generateHistoricalPrices(407.13)
  },
  {
    symbol: "UNH",
    name: "UnitedHealth Group Inc.",
    price: 486.71,
    change: 3.24,
    changePercent: 0.67,
    sector: "Healthcare",
    marketCap: 452000000000,
    prices: generateHistoricalPrices(486.71)
  },
  {
    symbol: "HD",
    name: "The Home Depot, Inc.",
    price: 307.39,
    change: -2.34,
    changePercent: -0.76,
    sector: "Consumer Cyclical",
    marketCap: 307000000000,
    prices: generateHistoricalPrices(307.39)
  }
];

// Services for working with stock data
export const StockService = {
  // Get all stocks
  getStocks: (): Stock[] => {
    return stocksData;
  },
  
  // Get stock by symbol
  getStockBySymbol: (symbol: string): Stock | undefined => {
    return stocksData.find(stock => stock.symbol === symbol);
  },
  
  // Search stocks by name or symbol
  searchStocks: (query: string): Stock[] => {
    const searchTerm = query.toLowerCase();
    return stocksData.filter(
      stock => 
        stock.symbol.toLowerCase().includes(searchTerm) || 
        stock.name.toLowerCase().includes(searchTerm)
    );
  },
  
  // Filter stocks by sector
  filterStocksBySector: (sector: string): Stock[] => {
    return stocksData.filter(stock => stock.sector === sector);
  },
  
  // Get top gainers
  getTopGainers: (limit: number = 5): Stock[] => {
    return [...stocksData]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, limit);
  },
  
  // Get top losers
  getTopLosers: (limit: number = 5): Stock[] => {
    return [...stocksData]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit);
  },
  
  // Get stocks by market cap range
  getStocksByMarketCap: (min: number, max: number): Stock[] => {
    return stocksData.filter(
      stock => stock.marketCap >= min && stock.marketCap <= max
    );
  },
  
  // Format market cap to readable format
  formatMarketCap: (marketCap: number): string => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    } else {
      return `$${marketCap.toLocaleString()}`;
    }
  },
  
  // Format price change with + or - sign
  formatPriceChange: (change: number): string => {
    return change >= 0 ? `+${change.toFixed(2)}` : `${change.toFixed(2)}`;
  },
  
  // Format percentage change with + or - sign
  formatPercentChange: (changePercent: number): string => {
    return changePercent >= 0 
      ? `+${changePercent.toFixed(2)}%` 
      : `${changePercent.toFixed(2)}%`;
  },
  
  // Get stock price range
  getPriceRange: (stock: Stock): { min: number, max: number } => {
    const prices = stock.prices.map(price => price.close);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }
};

// Local storage service for watchlist
export const WatchlistService = {
  // Get watchlist
  getWatchlist: (): string[] => {
    const watchlist = localStorage.getItem('watchlist');
    return watchlist ? JSON.parse(watchlist) : [];
  },
  
  // Add stock to watchlist
  addToWatchlist: (symbol: string): void => {
    const watchlist = WatchlistService.getWatchlist();
    if (!watchlist.includes(symbol)) {
      watchlist.push(symbol);
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
  },
  
  // Remove stock from watchlist
  removeFromWatchlist: (symbol: string): void => {
    let watchlist = WatchlistService.getWatchlist();
    watchlist = watchlist.filter(item => item !== symbol);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  },
  
  // Check if stock is in watchlist
  isInWatchlist: (symbol: string): boolean => {
    const watchlist = WatchlistService.getWatchlist();
    return watchlist.includes(symbol);
  },
  
  // Get watchlist stocks
  getWatchlistStocks: (): Stock[] => {
    const watchlist = WatchlistService.getWatchlist();
    return stocksData.filter(stock => watchlist.includes(stock.symbol));
  }
};
