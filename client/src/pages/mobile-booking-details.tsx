import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Briefcase, 
  Baby,
  Plane,
  FileText,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Booking } from '@shared/schema';
import { format, parseISO } from 'date-fns';

const editBookingSchema = z.object({
  scheduledDateTime: z.string().min(1, 'Date and time required'),
  pickupAddress: z.string().min(1, 'Pickup address required'),
  destinationAddress: z.string().optional(),
  passengerCount: z.number().min(1).max(20),
  luggageCount: z.number().min(0).max(50),
  babySeat: z.boolean(),
  specialInstructions: z.string().optional(),
});

type EditBookingForm = z.infer<typeof editBookingSchema>;

interface PriceComparison {
  oldPrice: number;
  newPrice: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    total: number;
  };
}

export default function MobileBookingDetails() {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPriceApproval, setShowPriceApproval] = useState(false);
  const [priceComparison, setPriceComparison] = useState<PriceComparison | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);

  // Fetch booking details
  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ['/api/bookings', id],
    enabled: !!id,
  });

  const form = useForm<EditBookingForm>({
    resolver: zodResolver(editBookingSchema),
    defaultValues: {
      scheduledDateTime: booking ? format(
        typeof booking.scheduledDateTime === 'string' 
          ? parseISO(booking.scheduledDateTime) 
          : booking.scheduledDateTime,
        "yyyy-MM-dd'T'HH:mm"
      ) : '',
      pickupAddress: booking?.pickupAddress || '',
      destinationAddress: booking?.destinationAddress || '',
      passengerCount: booking?.passengerCount || 1,
      luggageCount: booking?.luggageCount || 0,
      babySeat: booking?.babySeat || false,
      specialInstructions: booking?.specialInstructions || '',
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/bookings/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', id] });
      setIsEditing(false);
      setShowPriceApproval(false);
      setPendingUpdate(null);
      toast({
        title: 'Booking Updated',
        description: 'Your booking has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Price calculation mutation
  const calculatePriceMutation = useMutation({
    mutationFn: async (data: EditBookingForm) => {
      // For now, we'll calculate based on existing booking data
      // In a real implementation, you'd call the pricing API
      const response = await apiRequest('POST', '/api/calculate-price', {
        vehicleType: booking?.vehicleTypeId,
        serviceType: booking?.bookingType,
        distance: booking?.estimatedDistance,
        hours: booking?.requestedHours,
        date: data.scheduledDateTime?.split('T')[0],
        time: data.scheduledDateTime?.split('T')[1],
      });
      return response.json();
    },
  });

  const onSubmit = async (data: EditBookingForm) => {
    if (!booking) return;

    // Convert form data to booking update format
    const updateData = {
      scheduledDateTime: new Date(data.scheduledDateTime).toISOString(),
      pickupAddress: data.pickupAddress,
      destinationAddress: data.destinationAddress,
      passengerCount: data.passengerCount,
      luggageCount: data.luggageCount,
      babySeat: data.babySeat,
      specialInstructions: data.specialInstructions,
    };

    // Check if changes might affect price
    const originalDateTime = format(
      typeof booking.scheduledDateTime === 'string' 
        ? parseISO(booking.scheduledDateTime) 
        : booking.scheduledDateTime,
      "yyyy-MM-dd'T'HH:mm"
    );
    const priceAffectingChanges = 
      data.scheduledDateTime !== originalDateTime ||
      data.pickupAddress !== booking.pickupAddress ||
      data.destinationAddress !== booking.destinationAddress ||
      data.passengerCount !== booking.passengerCount;

    if (priceAffectingChanges && booking.status === 'pending') {
      // Calculate new price and show approval dialog
      try {
        const priceData = await calculatePriceMutation.mutateAsync(data);
        const oldPrice = parseFloat(booking.totalAmount as string);
        const newPrice = parseFloat(priceData.price || priceData.total || booking.totalAmount);

        if (Math.abs(oldPrice - newPrice) > 0.01) {
          // Price changed, show approval dialog
          setPriceComparison({
            oldPrice,
            newPrice,
            breakdown: priceData.breakdown || {
              baseFare: parseFloat(priceData.baseFare || '0'),
              distanceFare: parseFloat(priceData.distanceFare || '0'),
              timeFare: parseFloat(priceData.timeFare || '0'),
              total: newPrice,
            },
          });
          setPendingUpdate(updateData);
          setShowPriceApproval(true);
          return;
        }
      } catch (error) {
        console.error('Price calculation failed:', error);
        // Continue with update even if price calc fails
      }
    }

    // No price change or non-price fields changed, proceed with update
    updateMutation.mutate(updateData);
  };

  const handleApprovePriceChange = () => {
    if (pendingUpdate) {
      updateMutation.mutate(pendingUpdate);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/mobile-passenger')}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Button>
        <div className="text-center py-12">
          <p className="text-gray-600">Booking not found</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const canEdit = booking.status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/mobile-passenger')}
            className="text-white hover:bg-blue-500/20"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          {canEdit && !isEditing && (
            <Button
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="text-white hover:bg-blue-500/20"
              data-testid="button-edit"
            >
              <Edit className="w-5 h-5 mr-2" />
              Edit
            </Button>
          )}
        </div>
        <h1 className="text-2xl font-bold">Booking Details</h1>
        <p className="text-blue-100 text-sm mt-1">#{booking.id.slice(0, 8)}</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge className={`${statusColors[booking.status || 'pending']} px-4 py-2 text-sm font-semibold`}>
            {booking.status?.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {isEditing ? (
          /* Edit Form */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Edit Booking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="scheduledDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            data-testid="input-scheduled-datetime"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickupAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter pickup address"
                            data-testid="input-pickup-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {booking.bookingType === 'transfer' && (
                    <FormField
                      control={form.control}
                      name="destinationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter destination address"
                              data-testid="input-destination-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="passengerCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passengers</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-passenger-count"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="luggageCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Luggage</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-luggage-count"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="babySeat"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4"
                            data-testid="input-baby-seat"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Baby seat required</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any special requests or notes"
                            rows={3}
                            data-testid="input-special-instructions"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1"
                  data-testid="button-cancel-edit"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={updateMutation.isPending || calculatePriceMutation.isPending}
                  data-testid="button-save-changes"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          /* View Mode */
          <>
            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium" data-testid="text-pickup-address">{booking.pickupAddress}</p>
                </div>
                {booking.destinationAddress && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-500">Destination</p>
                      <p className="font-medium" data-testid="text-destination-address">{booking.destinationAddress}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="font-medium" data-testid="text-scheduled-time">
                    {format(
                      typeof booking.scheduledDateTime === 'string' 
                        ? parseISO(booking.scheduledDateTime) 
                        : booking.scheduledDateTime,
                      'PPP p'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Passengers & Luggage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Passengers</span>
                  <span className="font-medium" data-testid="text-passenger-count">{booking.passengerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Luggage</span>
                  <span className="font-medium" data-testid="text-luggage-count">{booking.luggageCount}</span>
                </div>
                {booking.babySeat && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Baby Seat</span>
                    <Baby className="w-5 h-5 text-blue-600" data-testid="icon-baby-seat" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Flight Info */}
            {booking.flightNumber && !booking.noFlightInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Plane className="w-5 h-5 mr-2 text-blue-600" />
                    Flight Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flight Number</span>
                    <span className="font-medium" data-testid="text-flight-number">{booking.flightNumber}</span>
                  </div>
                  {booking.flightAirline && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Airline</span>
                      <span className="font-medium">{booking.flightAirline}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Special Instructions */}
            {booking.specialInstructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700" data-testid="text-special-instructions">{booking.specialInstructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Price */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600" data-testid="text-total-amount">
                    ${parseFloat(booking.totalAmount as string).toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Payment: <span className="font-medium capitalize">{booking.paymentStatus}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Price Approval Dialog */}
      <Dialog open={showPriceApproval} onOpenChange={setShowPriceApproval}>
        <DialogContent className="max-w-md" data-testid="dialog-price-approval">
          <DialogHeader>
            <DialogTitle>Price Change Approval Required</DialogTitle>
            <DialogDescription>
              Your changes have affected the booking price. Please review and approve the new price.
            </DialogDescription>
          </DialogHeader>

          {priceComparison && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Original Price</span>
                  <span className="text-lg font-medium line-through text-gray-500" data-testid="text-old-price">
                    ${priceComparison.oldPrice.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Price</span>
                  <span className="text-2xl font-bold text-blue-600" data-testid="text-new-price">
                    ${priceComparison.newPrice.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {priceComparison.newPrice > priceComparison.oldPrice ? 'Increase' : 'Decrease'}
                  </span>
                  <span className={`text-lg font-bold ${
                    priceComparison.newPrice > priceComparison.oldPrice ? 'text-red-600' : 'text-green-600'
                  }`} data-testid="text-price-difference">
                    {priceComparison.newPrice > priceComparison.oldPrice ? '+' : ''}
                    ${(priceComparison.newPrice - priceComparison.oldPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-sm text-blue-900">Price Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Fare</span>
                    <span>${priceComparison.breakdown.baseFare.toFixed(2)}</span>
                  </div>
                  {priceComparison.breakdown.distanceFare > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance Fare</span>
                      <span>${priceComparison.breakdown.distanceFare.toFixed(2)}</span>
                    </div>
                  )}
                  {priceComparison.breakdown.timeFare > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Fare</span>
                      <span>${priceComparison.breakdown.timeFare.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPriceApproval(false);
                setPendingUpdate(null);
              }}
              data-testid="button-reject-price"
            >
              Reject Changes
            </Button>
            <Button
              onClick={handleApprovePriceChange}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateMutation.isPending}
              data-testid="button-approve-price"
            >
              {updateMutation.isPending ? 'Saving...' : 'Approve & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
