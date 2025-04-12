
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <header className="bg-stock-blue-dark text-white py-4 px-6 shadow-md">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">StockVision</h1>
          </div>
          
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              type="text"
              placeholder="Search stocks..." 
              className="pl-10 bg-stock-blue text-white border-gray-600 focus:border-blue-400 focus:ring-blue-400"
              onChange={handleSearchChange}
            />
          </div>
          
          <nav className="flex items-center space-x-6">
            <a href="#dashboard" className="hover:text-blue-200 transition-colors">Dashboard</a>
            <a href="#stocks" className="hover:text-blue-200 transition-colors">Stocks</a>
            <a href="#watchlist" className="hover:text-blue-200 transition-colors">Watchlist</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
