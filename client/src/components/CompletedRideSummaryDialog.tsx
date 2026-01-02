import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Navigation, 
  User, 
  Car, 
  DollarSign, 
  Clock, 
  Luggage,
  Baby,
  Plane,
  FileText,
  CalendarDays,
  Users,
  CheckCircle2,
  Phone,
  Mail
} from "lucide-react";

interface CompletedRideSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any | null;
  vehicleTypes: any[];
  allUsers: any[];
}

export function CompletedRideSummaryDialog({
  open,
  onOpenChange,
  booking,
  vehicleTypes,
  allUsers
}: CompletedRideSummaryDialogProps) {
  if (!booking) return null;

  const passenger = allUsers?.find(u => u.id === booking.passengerId);
  const vehicleType = vehicleTypes?.find(vt => vt.id === booking.vehicleTypeId);
  
  const hasDriverInfo = booking.driverFirstName || booking.driverLastName;
  const driverFullName = hasDriverInfo 
    ? `${booking.driverFirstName || ''} ${booking.driverLastName || ''}`.trim() 
    : null;

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return "$0.00";
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) => (
    <div className="flex items-start gap-2 py-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Completed Ride Summary
              </DialogTitle>
              <DialogDescription className="mt-1">
                Booking #{booking.confirmationNumber || booking.id?.substring(0, 8)}
              </DialogDescription>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              Completed
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <User className="w-4 h-4 text-blue-600" />
                Passenger Information
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <p className="font-semibold text-foreground">
                  {passenger ? `${passenger.firstName} ${passenger.lastName}` : booking.passengerName || "Unknown"}
                </p>
                {(passenger?.email || booking.passengerEmail) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {passenger?.email || booking.passengerEmail}
                  </p>
                )}
                {(passenger?.phone || booking.passengerPhone) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {passenger?.phone || booking.passengerPhone}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 text-right">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Car className="w-4 h-4 text-purple-600" />
                Driver & Vehicle
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <p className="font-semibold text-foreground">
                  {driverFullName || "Unassigned"}
                </p>
                {vehicleType && (
                  <p className="text-sm text-muted-foreground">{vehicleType.name}</p>
                )}
                {booking.driverPhone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {booking.driverPhone}
                  </p>
                )}
                {booking.driverVehiclePlate && (
                  <p className="text-sm text-muted-foreground">Plate: {booking.driverVehiclePlate}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <MapPin className="w-4 h-4 text-green-600" />
              Trip Details
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Pickup</p>
                  <p className="text-sm font-medium text-foreground">{booking.pickupAddress || "N/A"}</p>
                </div>
              </div>

              {booking.viaPoints && booking.viaPoints.length > 0 && (
                <>
                  {booking.viaPoints.map((via: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Stop {index + 1}</p>
                        <p className="text-sm font-medium text-foreground">{via.address}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Destination</p>
                  <p className="text-sm font-medium text-foreground">{booking.destinationAddress || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoRow 
              label="Date & Time" 
              value={formatDateTime(booking.scheduledDateTime)}
              icon={CalendarDays}
            />
            <InfoRow 
              label="Booking Type" 
              value={booking.bookingType === 'hourly' ? `Hourly (${booking.requestedHours || 2}h)` : 'Transfer'}
              icon={Clock}
            />
            <InfoRow 
              label="Passengers" 
              value={booking.passengerCount || 1}
              icon={Users}
            />
            <InfoRow 
              label="Luggage" 
              value={booking.luggageCount || 0}
              icon={Luggage}
            />
          </div>

          {booking.babySeat && (
            <div className="flex items-center gap-2 text-sm text-pink-600">
              <Baby className="w-4 h-4" />
              <span>Baby seat requested</span>
            </div>
          )}

          {(booking.flightNumber || booking.flight_number) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <Plane className="w-4 h-4 text-sky-600" />
                  Flight Information
                </h3>
                <div className="bg-sky-50 dark:bg-sky-950/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Flight Number</p>
                      <p className="text-sm font-semibold text-foreground">
                        {booking.flightAirline || booking.flight_airline} {booking.flightNumber || booking.flight_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Route</p>
                      <p className="text-sm font-medium text-foreground">
                        {booking.flightDepartureAirport || booking.flight_departure_airport || "N/A"} → {booking.flightArrivalAirport || booking.flight_arrival_airport || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {(booking.specialInstructions || booking.special_instructions) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <FileText className="w-4 h-4 text-gray-600" />
                  Special Instructions
                </h3>
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                  {booking.specialInstructions || booking.special_instructions}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Payment Summary
            </h3>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Base Fare</span>
                <span className="text-sm font-medium">{formatCurrency(booking.baseFare)}</span>
              </div>
              
              {parseFloat(booking.gratuityAmount || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gratuity</span>
                  <span className="text-sm font-medium">{formatCurrency(booking.gratuityAmount)}</span>
                </div>
              )}
              
              {parseFloat(booking.airportFeeAmount || 0) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Airport Fee</span>
                  <span className="text-sm font-medium">{formatCurrency(booking.airportFeeAmount)}</span>
                </div>
              )}
              
              {parseFloat(booking.discountAmount || 0) > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Discount</span>
                  <span className="text-sm font-medium">-{formatCurrency(booking.discountAmount)}</span>
                </div>
              )}

              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Total Amount</span>
                <span className="font-bold text-lg text-foreground">{formatCurrency(booking.totalAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <Badge variant="outline" className="capitalize">
                  {(booking.paymentMethod || 'pay_now').replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {booking.driverPayment && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Driver Payment</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {booking.driverPaymentPaid ? "Paid to driver" : "Pending payment"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    {formatCurrency(booking.driverPayment)}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={booking.driverPaymentPaid 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                    }
                  >
                    {booking.driverPaymentPaid ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
