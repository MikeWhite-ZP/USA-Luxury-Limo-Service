import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AddressSuggestion {
  id: string;
  display_name: string;
  address: any;
  position: { lat: number; lon: number };
}

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  lat: string | null;
  lon: string | null;
  isDefault: boolean;
}

interface AddressAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, coords?: { lat: number; lon: number }) => void;
  placeholder?: string;
  userId?: string; // For fetching saved addresses
  disabled?: boolean;
  required?: boolean;
  'data-testid'?: string;
}

export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter address',
  userId,
  disabled = false,
  required = false,
  'data-testid': testId,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch saved addresses if userId is provided
  const { data: savedAddresses } = useQuery<SavedAddress[]>({
    queryKey: ['/api/saved-addresses/user', userId],
    enabled: !!userId,
  });

  // Handle address input with debouncing for TomTom suggestions
  const handleAddressInput = (inputValue: string) => {
    onChange(inputValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(inputValue)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          const suggestionList = data.results?.map((result: any) => ({
            id: result.id || result.address?.freeformAddress,
            display_name: result.address?.freeformAddress || result.poi?.name,
            address: result.address,
            position: result.position
          })) || [];
          
          setSuggestions(suggestionList);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }, 300);
  };

  // Select a TomTom suggestion
  const selectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name, suggestion.position);
    setShowSuggestions(false);
  };

  // Select a saved address
  const selectSavedAddress = (address: SavedAddress) => {
    const coords = address.lat && address.lon 
      ? { lat: parseFloat(address.lat), lon: parseFloat(address.lon) }
      : undefined;
    onChange(address.address, coords);
    setShowSavedAddresses(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`#${id}-container`)) {
        setShowSuggestions(false);
        setShowSavedAddresses(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [id]);

  return (
    <div id={`${id}-container`} className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            value={value}
            onChange={(e) => handleAddressInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            data-testid={testId}
          />

        {/* Saved Addresses Dropdown */}
        {showSavedAddresses && savedAddresses && savedAddresses.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-b-lg max-h-60 overflow-y-auto z-50 shadow-lg mt-1">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">SAVED ADDRESSES</p>
            </div>
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className="p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => selectSavedAddress(address)}
                data-testid={`${testId}-saved-${address.id}`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{address.label}</span>
                      {address.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{address.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

          {/* TomTom Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-b-lg max-h-60 overflow-y-auto z-50 shadow-lg mt-1">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">SUGGESTIONS</p>
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => selectSuggestion(suggestion)}
                  data-testid={`${testId}-suggestion-${index}`}
                >
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="font-medium text-gray-800 dark:text-gray-200">{suggestion.display_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Addresses Dropdown Selector */}
        {savedAddresses && savedAddresses.length > 0 && (
          <Select
            value=""
            onValueChange={(addressId) => {
              const address = savedAddresses.find(a => a.id === addressId);
              if (address) selectSavedAddress(address);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-[200px]" data-testid={`${testId}-saved-dropdown`}>
              <SelectValue placeholder="Saved addresses" />
            </SelectTrigger>
            <SelectContent>
              {savedAddresses.map((address) => (
                <SelectItem key={address.id} value={address.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span className="font-medium">{address.label}</span>
                    {address.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-1 rounded">Default</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
