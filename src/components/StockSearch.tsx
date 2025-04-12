
import React, { useState, useEffect } from 'react';
import { 
  Stock, 
  StockService,
  sectors
} from '@/services/StockData';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface StockSearchProps {
  stocks: Stock[];
  onFilteredStocks: (filteredStocks: Stock[]) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ 
  stocks, 
  onFilteredStocks
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 1000
  });
  
  // Apply filters
  useEffect(() => {
    let filteredStocks = [...stocks];
    
    // Search term filter
    if (searchTerm) {
      filteredStocks = StockService.searchStocks(searchTerm);
    }
    
    // Sector filter
    if (selectedSectors.length > 0) {
      filteredStocks = filteredStocks.filter(stock => 
        selectedSectors.includes(stock.sector)
      );
    }
    
    // Price range filter
    filteredStocks = filteredStocks.filter(
      stock => stock.price >= priceRange.min && stock.price <= priceRange.max
    );
    
    onFilteredStocks(filteredStocks);
  }, [searchTerm, selectedSectors, priceRange, stocks, onFilteredStocks]);
  
  const handleSectorToggle = (sector: string) => {
    setSelectedSectors(prev => {
      if (prev.includes(sector)) {
        return prev.filter(s => s !== sector);
      } else {
        return [...prev, sector];
      }
    });
  };
  
  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setPriceRange(prev => ({
      ...prev,
      [type]: numValue
    }));
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSectors([]);
    setPriceRange({ min: 0, max: 1000 });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input 
            type="text"
            placeholder="Search by company name or symbol..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {(selectedSectors.length > 0 || priceRange.min > 0 || priceRange.max < 1000) && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h3 className="font-semibold">Price Range</h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="min-price">Min ($)</Label>
                    <Input 
                      id="min-price"
                      type="number" 
                      min="0" 
                      value={priceRange.min}
                      onChange={(e) => handlePriceChange('min', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="max-price">Max ($)</Label>
                    <Input 
                      id="max-price"
                      type="number" 
                      min="0" 
                      value={priceRange.max}
                      onChange={(e) => handlePriceChange('max', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Sectors</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {sectors.map(sector => (
                      <div key={sector} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`sector-${sector}`}
                          checked={selectedSectors.includes(sector)}
                          onCheckedChange={() => handleSectorToggle(sector)}
                        />
                        <Label 
                          htmlFor={`sector-${sector}`}
                          className="text-sm cursor-pointer"
                        >
                          {sector}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Select 
            onValueChange={(value) => {
              if (value === 'all') {
                setSelectedSectors([]);
              } else {
                setSelectedSectors([value]);
              }
            }}
            value={selectedSectors.length === 1 ? selectedSectors[0] : 'all'}
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
        </div>
      </div>
    </div>
  );
};

export default StockSearch;
