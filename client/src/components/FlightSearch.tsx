import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, Search, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface FlightInfo {
  id: number;
  flightNumber: string;
  airline: string;
  departureIata: string;
  arrivalIata: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  departureTerminal: string;
  arrivalTerminal: string;
  baggageClaim?: string;
  aircraft?: string;
  status?: string;
}

interface FlightSearchProps {
  selectedFlight: FlightInfo | null;
  onFlightSelect: (flight: FlightInfo | null) => void;
  bookingDate?: string;
  className?: string;
}

const airlineNames: Record<string, string> = {
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta Air Lines',
  'BA': 'British Airways',
  'EK': 'Emirates',
  'KL': 'KLM Royal Dutch Airlines',
  'AF': 'Air France',
  'LH': 'Lufthansa',
  'QR': 'Qatar Airways',
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'JL': 'Japan Airlines',
  'NH': 'All Nippon Airways',
  'WN': 'Southwest Airlines',
  'B6': 'JetBlue Airways',
  'AS': 'Alaska Airlines',
  'F9': 'Frontier Airlines',
  'NK': 'Spirit Airlines',
};

export default function FlightSearch({ 
  selectedFlight, 
  onFlightSelect, 
  bookingDate,
  className = "" 
}: FlightSearchProps) {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [flightResults, setFlightResults] = useState<FlightInfo[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return { date: '', time: '--:--' };
    try {
      // Handle API timestamps like "2025-12-20 10:45-05:00" by normalizing to ISO format
      // Replace space with T and handle timezone format variations
      let normalized = dateString;
      
      // Check if it's already an object with .local property (API sometimes returns this)
      if (typeof dateString === 'object' && (dateString as any).local) {
        normalized = (dateString as any).local;
      }
      
      // Normalize "2025-12-20 10:45-05:00" to "2025-12-20T10:45:00-05:00"
      if (typeof normalized === 'string') {
        // Replace first space with T for ISO format
        normalized = normalized.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/, '$1T$2:00');
      }
      
      const date = new Date(normalized);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Fallback: try to extract date/time parts manually
        const match = String(dateString).match(/(\d{4}-\d{2}-\d{2})[\sT]?(\d{2}:\d{2})/);
        if (match) {
          const [, datePart, timePart] = match;
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes] = timePart.split(':').map(Number);
          return {
            date: `${day.toString().padStart(2, '0')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]} ${year}`,
            time: `${hours > 12 ? hours - 12 : hours || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
          };
        }
        return { date: '', time: '--:--' };
      }
      
      return {
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      };
    } catch {
      return { date: '', time: '--:--' };
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast({
        title: "Flight Number Required",
        description: "Please enter a flight number (e.g., UA1797, DL3427)",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setShowResults(false);
    setSelectedIndex(null);

    try {
      const flightNumber = searchInput.trim().toUpperCase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const queryParams = new URLSearchParams({ flightNumber });
      if (bookingDate) {
        queryParams.append('date', bookingDate);
      }

      const response = await fetch(
        `/api/flights/search?${queryParams.toString()}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 504 || response.status === 503) {
          throw new Error('Flight search service is temporarily slow. Please try again.');
        }
        throw new Error(errorData.error || 'Flight search failed');
      }

      const data = await response.json();
      
      let flightItems = [];
      if (Array.isArray(data)) {
        flightItems = data;
      } else if (data.items) {
        flightItems = data.items;
      }

      if (flightItems.length === 0) {
        toast({
          title: "No Flights Found",
          description: `No flights found for ${flightNumber}`,
          variant: "destructive",
        });
        return;
      }

      const flights: FlightInfo[] = flightItems.map((flight: any, index: number) => {
        const flightNum = flight.number || flightNumber;
        const airlineCode = flightNum.trim().split(' ')[0] || flightNum.substring(0, 2);
        const airlineName = airlineNames[airlineCode] || flight.airline?.name || airlineCode;

        const departure = flight.departure || {};
        const arrival = flight.arrival || {};

        return {
          id: index + 1,
          flightNumber: flightNum.trim(),
          airline: airlineName,
          departureIata: departure.airport?.iata || '',
          arrivalIata: arrival.airport?.iata || '',
          departureAirport: departure.airport?.name || departure.airport?.iata || 'N/A',
          arrivalAirport: arrival.airport?.name || arrival.airport?.iata || 'N/A',
          departureTime: departure.actualTimeLocal || departure.scheduledTimeLocal || departure.scheduledTime?.local || departure.scheduledTime || 'N/A',
          arrivalTime: arrival.actualTimeLocal || arrival.scheduledTimeLocal || arrival.scheduledTime?.local || arrival.scheduledTime || 'N/A',
          departureTerminal: departure.terminal || '',
          arrivalTerminal: arrival.terminal || '',
          baggageClaim: arrival.baggageClaim || '',
          aircraft: flight.aircraft?.model || '',
          status: flight.status || 'Scheduled',
        };
      });

      if (flights.length === 1) {
        onFlightSelect(flights[0]);
        setSearchInput("");
        setShowResults(false);
        toast({
          title: "Flight Confirmed",
          description: `${flights[0].airline} ${flights[0].flightNumber} added to your booking`,
        });
      } else {
        setFlightResults(flights);
        setShowResults(true);
      }
    } catch (error: any) {
      console.error('Flight search error:', error);
      if (error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "The flight search is taking too long. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Failed",
          description: error.message || "Unable to search for flights",
          variant: "destructive",
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedIndex !== null && flightResults[selectedIndex]) {
      onFlightSelect(flightResults[selectedIndex]);
      setSearchInput("");
      setShowResults(false);
      setFlightResults([]);
      setSelectedIndex(null);
      toast({
        title: "Flight Confirmed",
        description: `${flightResults[selectedIndex].airline} ${flightResults[selectedIndex].flightNumber} added`,
      });
    }
  };

  const handleClear = () => {
    onFlightSelect(null);
    setSearchInput("");
    setShowResults(false);
    setFlightResults([]);
    setSelectedIndex(null);
  };

  if (selectedFlight) {
    const depDateTime = formatDateTime(selectedFlight.departureTime);
    const arrDateTime = formatDateTime(selectedFlight.arrivalTime);

    return (
      <div className={`${className}`}>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-teal-500 rounded flex items-center justify-center">
                <Plane className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-slate-900 dark:text-slate-100">{selectedFlight.flightNumber}</span>
              <Check className="w-3 h-3 text-teal-500" strokeWidth={3} />
            </div>
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
              data-testid="button-clear-flight"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700">
            <div className="px-2 py-1">
              <p className="text-[7px] text-slate-500 uppercase font-semibold">Dep</p>
              <p className="text-[9px] font-medium text-slate-900 dark:text-slate-100 truncate">{selectedFlight.departureIata}</p>
              {selectedFlight.departureTerminal && <p className="text-[8px] text-slate-500">T{selectedFlight.departureTerminal}</p>}
              {depDateTime.time !== '--:--' && <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{depDateTime.time}</p>}
            </div>
            <div className="px-2 py-1">
              <p className="text-[7px] text-slate-500 uppercase font-semibold">Arr</p>
              <p className="text-[9px] font-medium text-slate-900 dark:text-slate-100 truncate">{selectedFlight.arrivalIata}</p>
              {selectedFlight.arrivalTerminal && <p className="text-[8px] text-slate-500">T{selectedFlight.arrivalTerminal}</p>}
              {arrDateTime.time !== '--:--' && <p className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{arrDateTime.time}</p>}
              {selectedFlight.baggageClaim && <p className="text-[8px] text-amber-600 font-medium">Bag: {selectedFlight.baggageClaim}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-1">
        <Input
          placeholder="Flight # (e.g. UA1797)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="h-6 text-[10px] px-1.5 flex-1"
          data-testid="input-flight-search"
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchInput.trim()}
          size="sm"
          className="h-6 px-2 text-[9px] bg-amber-500 hover:bg-amber-600"
          data-testid="button-verify-flight"
        >
          {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
        </Button>
      </div>

      {showResults && flightResults.length > 0 && (
        <div className="space-y-1">
          {flightResults.map((flight, index) => {
            const arrDateTime = formatDateTime(flight.arrivalTime);
            const isSelected = selectedIndex === index;

            return (
              <button
                key={flight.id}
                onClick={() => setSelectedIndex(index)}
                className={`w-full text-left px-2 py-1 border rounded transition-all ${
                  isSelected 
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
                data-testid={`flight-option-${flight.id}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {flight.departureIata} → {flight.arrivalIata}
                      {flight.arrivalTerminal && <span className="text-slate-500"> T{flight.arrivalTerminal}</span>}
                    </p>
                    <p className="text-[8px] text-slate-500 truncate">
                      {arrDateTime.time}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
                  }`}>
                    {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}

          {selectedIndex !== null && (
            <Button
              onClick={handleConfirmSelection}
              size="sm"
              className="w-full h-5 text-[9px] bg-teal-500 hover:bg-teal-600"
              data-testid="button-confirm-flight"
            >
              Confirm
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
