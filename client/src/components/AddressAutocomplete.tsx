import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Clock, Building2, Plane, Hotel, Utensils, ShoppingBag, Car, Coffee, Hospital, School, Landmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AddressSuggestion {
  id: string;
  display_name: string;
  secondary_text?: string; // Address line for POIs
  address: any;
  position: { lat: number; lon: number };
  isPOI: boolean;
  poiCategory?: string;
  poiCategoryIcon?: string;
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get POI category icon based on TomTom POI data
  // TomTom provides categories in poi.categories (array of strings) and poi.classifications (array with code/names)
  const getPOICategoryInfo = (poi: any): { icon: string; label: string } => {
    if (!poi) return { icon: 'building', label: 'Place' };
    
    // Try to get category from multiple TomTom fields
    let categoryName = '';
    
    // Check poi.categories (array of strings)
    if (poi.categories && poi.categories.length > 0) {
      categoryName = poi.categories.join(' ').toLowerCase();
    }
    // Check poi.classifications (array with code and names)
    else if (poi.classifications && poi.classifications.length > 0) {
      const classification = poi.classifications[0];
      if (classification.names && classification.names.length > 0) {
        categoryName = classification.names.map((n: any) => n.name || n).join(' ').toLowerCase();
      } else if (classification.code) {
        categoryName = classification.code.toLowerCase();
      }
    }
    // Fall back to poi.categorySet if present (older API version)
    else if (poi.categorySet && poi.categorySet.length > 0) {
      categoryName = poi.categorySet[0]?.name?.toLowerCase() || '';
    }
    
    if (categoryName.includes('airport') || categoryName.includes('aviation')) {
      return { icon: 'plane', label: 'Airport' };
    }
    if (categoryName.includes('hotel') || categoryName.includes('motel') || categoryName.includes('lodging') || categoryName.includes('accommodation')) {
      return { icon: 'hotel', label: 'Hotel' };
    }
    if (categoryName.includes('restaurant') || categoryName.includes('food') || categoryName.includes('dining')) {
      return { icon: 'restaurant', label: 'Restaurant' };
    }
    if (categoryName.includes('cafe') || categoryName.includes('coffee')) {
      return { icon: 'coffee', label: 'Cafe' };
    }
    if (categoryName.includes('hospital') || categoryName.includes('medical') || categoryName.includes('health') || categoryName.includes('clinic')) {
      return { icon: 'hospital', label: 'Medical' };
    }
    if (categoryName.includes('school') || categoryName.includes('university') || categoryName.includes('college') || categoryName.includes('education')) {
      return { icon: 'school', label: 'Education' };
    }
    if (categoryName.includes('shop') || categoryName.includes('store') || categoryName.includes('mall') || categoryName.includes('retail') || categoryName.includes('market')) {
      return { icon: 'shopping', label: 'Shopping' };
    }
    if (categoryName.includes('parking') || categoryName.includes('car') || categoryName.includes('automotive') || categoryName.includes('gas') || categoryName.includes('fuel')) {
      return { icon: 'car', label: 'Automotive' };
    }
    if (categoryName.includes('government') || categoryName.includes('civic') || categoryName.includes('municipal') || categoryName.includes('city hall') || categoryName.includes('courthouse')) {
      return { icon: 'landmark', label: 'Government' };
    }
    
    return { icon: 'building', label: 'Place' };
  };

  // Render POI category icon
  const renderPOIIcon = (iconType: string) => {
    const iconProps = { className: "w-4 h-4 text-primary mt-0.5 flex-shrink-0" };
    switch (iconType) {
      case 'plane': return <Plane {...iconProps} />;
      case 'hotel': return <Hotel {...iconProps} />;
      case 'restaurant': return <Utensils {...iconProps} />;
      case 'coffee': return <Coffee {...iconProps} />;
      case 'hospital': return <Hospital {...iconProps} />;
      case 'school': return <School {...iconProps} />;
      case 'shopping': return <ShoppingBag {...iconProps} />;
      case 'car': return <Car {...iconProps} />;
      case 'landmark': return <Landmark {...iconProps} />;
      default: return <Building2 {...iconProps} />;
    }
  };

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
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(inputValue)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          const suggestionList = data.results?.map((result: any) => {
            const isPOI = !!result.poi;
            const categoryInfo = isPOI ? getPOICategoryInfo(result.poi) : { icon: 'mappin', label: '' };
            
            // For POIs, show POI name as primary, address as secondary
            // For addresses, show full address as primary
            const displayName = isPOI && result.poi?.name 
              ? result.poi.name 
              : result.address?.freeformAddress || '';
            
            const secondaryText = isPOI && result.address?.freeformAddress
              ? result.address.freeformAddress
              : '';
            
            return {
              id: result.id || result.address?.freeformAddress || Math.random().toString(),
              display_name: displayName,
              secondary_text: secondaryText,
              address: result.address,
              position: result.position,
              isPOI,
              poiCategory: categoryInfo.label,
              poiCategoryIcon: categoryInfo.icon,
            };
          }) || [];
          
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
    // For POIs, use the address as the value (more useful for booking)
    // For regular addresses, use the display_name
    const valueToUse = suggestion.isPOI && suggestion.secondary_text 
      ? suggestion.secondary_text 
      : suggestion.display_name;
    onChange(valueToUse, suggestion.position);
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
        {label}
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
            className="bg-background p-[5px]"
          />

        {/* Saved Addresses Dropdown */}
        {showSavedAddresses && savedAddresses && savedAddresses.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-b-lg max-h-60 overflow-y-auto z-50 shadow-lg mt-1">
            <div className="p-2 border-b border-border bg-muted">
              <p className="text-xs font-semibold text-muted-foreground">SAVED ADDRESSES</p>
            </div>
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className="p-3 cursor-pointer border-b border-border hover:bg-muted transition-colors"
                onClick={() => selectSavedAddress(address)}
                data-testid={`${testId}-saved-${address.id}`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{address.label}</span>
                      {address.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{address.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

          {/* TomTom Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-b-lg max-h-72 overflow-y-auto z-50 shadow-lg mt-1">
              <div className="p-2 border-b border-border bg-muted">
                <p className="text-xs font-semibold text-muted-foreground">SUGGESTIONS</p>
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 cursor-pointer border-b border-border hover:bg-muted transition-colors last:border-b-0"
                  onClick={() => selectSuggestion(suggestion)}
                  data-testid={`${testId}-suggestion-${index}`}
                >
                  <div className="flex items-start gap-2">
                    {suggestion.isPOI ? (
                      renderPOIIcon(suggestion.poiCategoryIcon || 'building')
                    ) : (
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{suggestion.display_name}</span>
                        {suggestion.isPOI && suggestion.poiCategory && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">
                            {suggestion.poiCategory}
                          </span>
                        )}
                      </div>
                      {suggestion.secondary_text && (
                        <p className="text-sm text-muted-foreground truncate">{suggestion.secondary_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Addresses Dropdown Selector */}
        {savedAddresses && savedAddresses.length > 0 && !disabled && (
          <Select
            value=""
            onValueChange={(addressId) => {
              const address = savedAddresses.find(a => a.id === addressId);
              if (address) selectSavedAddress(address);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-[200px] bg-background pt-[5px] pb-[5px] pl-[5px] pr-[5px] mt-[5px] mb-[5px]" data-testid={`${testId}-saved-dropdown`}>
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
