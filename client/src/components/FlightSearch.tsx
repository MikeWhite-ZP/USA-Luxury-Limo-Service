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
        <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Flight number</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedFlight.flightNumber.toLowerCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <button
                  onClick={handleClear}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                  data-testid="button-clear-flight"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 border-t border-slate-200 dark:border-slate-700">
            <div className="p-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-2">Departure</p>
              <div className="space-y-1">
                <p className="text-slate-900 dark:text-slate-100 font-semibold">{selectedFlight.departureAirport}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">{selectedFlight.departureIata}</span>
                  {selectedFlight.departureTerminal && <span className="ml-2">Terminal {selectedFlight.departureTerminal}</span>}
                </p>
                {depDateTime.date && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{depDateTime.date}</p>
                )}
                {depDateTime.time !== '--:--' && (
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{depDateTime.time}</p>
                )}
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-2">Arrival</p>
              <div className="space-y-1">
                <p className="text-slate-900 dark:text-slate-100 font-semibold">{selectedFlight.arrivalAirport}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">{selectedFlight.arrivalIata}</span>
                  {selectedFlight.arrivalTerminal && <span className="ml-2">Terminal {selectedFlight.arrivalTerminal}</span>}
                </p>
                {arrDateTime.date && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{arrDateTime.date}</p>
                )}
                {arrDateTime.time !== '--:--' && (
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{arrDateTime.time}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <Input
            placeholder="Enter flight number (e.g., UA1797)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-14 h-12 text-base border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-teal-500 focus:ring-teal-500"
            data-testid="input-flight-search"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchInput.trim()}
          className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-sm"
          data-testid="button-verify-flight"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Verify"
          )}
        </Button>
      </div>

      {showResults && flightResults.length > 0 && (
        <div className="space-y-3">
          {flightResults.map((flight, index) => {
            const arrDateTime = formatDateTime(flight.arrivalTime);
            const isSelected = selectedIndex === index;

            return (
              <button
                key={flight.id}
                onClick={() => setSelectedIndex(index)}
                className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                  isSelected 
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                data-testid={`flight-option-${flight.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {flight.departureIata} → {flight.arrivalIata} {flight.arrivalAirport}
                      {flight.arrivalTerminal && <span className="text-slate-600 dark:text-slate-400">, Terminal: {flight.arrivalTerminal}</span>}
                      {!flight.arrivalTerminal && <span className="text-slate-400">, Terminal: -</span>}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Est. Arrival: {arrDateTime.date && `${arrDateTime.date.split(' ')[0]} ${arrDateTime.date.split(' ')[1]},${arrDateTime.date.split(' ')[2]}`} {arrDateTime.time}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'border-teal-500 bg-teal-500' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}

          {selectedIndex !== null && (
            <Button
              onClick={handleConfirmSelection}
              className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg"
              data-testid="button-confirm-flight"
            >
              Confirm Selection
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
