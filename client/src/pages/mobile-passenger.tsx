import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { 
  Car, 
  Calendar, 
  CreditCard, 
  FileText, 
  LogOut, 
  Plus,
  Clock,
  CheckCircle2,
  MapPin,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Booking } from '@shared/schema';

export default function MobilePassenger() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Fetch user's bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate('/mobile-login?role=passenger');
    return null;
  }

  // Separate bookings into upcoming and past
  const now = new Date();
  const upcomingBookings = bookings?.filter(b => new Date(b.scheduledDateTime) >= now && b.status !== 'completed' && b.status !== 'cancelled') || [];
  const pastBookings = bookings?.filter(b => new Date(b.scheduledDateTime) < now || b.status === 'completed' || b.status === 'cancelled') || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome</h1>
            <p className="text-blue-100 mt-1">{user.firstName || ''} {user.lastName || ''}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-white hover:bg-white/20"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm">Upcoming</p>
            <p className="text-2xl font-bold mt-1">{upcomingBookings.length}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <p className="text-blue-100 text-sm">Total Rides</p>
            <p className="text-2xl font-bold mt-1">{bookings?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-6 mb-6">
        <Button
          onClick={() => navigate('/mobile-booking')}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-6 rounded-2xl text-lg font-semibold shadow-lg transition-all transform active:scale-95"
          data-testid="button-new-booking"
        >
          <Plus className="w-6 h-6 mr-2" />
          Book New Ride
        </Button>
      </div>

      {/* Main Content */}
      <div className="px-4 space-y-4">
        {/* Bookings Section */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">My Rides</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past')} className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-gray-100 mx-4 mb-3" style={{width: 'calc(100% - 2rem)'}}>
                <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" data-testid="tab-past">
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-0 px-4 pb-4">
                {bookingsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming rides</p>
                    <Button
                      variant="link"
                      onClick={() => navigate('/mobile-booking')}
                      className="mt-2"
                      data-testid="button-book-first-ride"
                    >
                      Book your first ride
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => navigate(`/mobile-booking-details/${booking.id}`)}
                        className="bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50 transition-colors cursor-pointer"
                        data-testid={`booking-card-${booking.id}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {formatStatus(booking.status)}
                          </span>
                          <span className="text-lg font-bold text-gray-900">${booking.totalAmount}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">
                              {new Date(booking.scheduledDateTime).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{booking.pickupAddress}</p>
                              {booking.destinationAddress && (
                                <>
                                  <div className="h-4 w-px bg-gray-300 ml-2 my-1" />
                                  <p className="text-gray-600">{booking.destinationAddress}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {booking.bookingType === 'hourly' && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>Hourly Service - {booking.requestedHours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-0 px-4 pb-4">
                {bookingsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : pastBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No past rides yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastBookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => navigate(`/mobile-booking-details/${booking.id}`)}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 active:bg-gray-100 transition-colors cursor-pointer opacity-90"
                        data-testid={`booking-card-${booking.id}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {formatStatus(booking.status)}
                          </span>
                          <span className="text-lg font-bold text-gray-700">${booking.totalAmount}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2 text-gray-600">
                            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{new Date(booking.scheduledDateTime).toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-700 font-medium">{booking.pickupAddress}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/mobile-invoices')}
            className="h-24 flex-col gap-2 border-2"
            data-testid="button-invoices"
          >
            <FileText className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium">Invoices</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/mobile-payment-methods')}
            className="h-24 flex-col gap-2 border-2"
            data-testid="button-payment-methods"
          >
            <CreditCard className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium">Payment</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
