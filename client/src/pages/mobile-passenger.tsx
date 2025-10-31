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
  DollarSign,
  Home,
  User,
  Menu,
  X
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

type Section = 'home' | 'new-booking' | 'saved-locations' | 'invoices' | 'payment' | 'account';

export default function MobilePassenger() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Separate bookings into active/upcoming and past
  const now = new Date();
  
  // Active rides: currently in progress or happening soon
  const activeStatuses = ['confirmed', 'on_the_way', 'arrived', 'on_board', 'in_progress'];
  const activeBookings = bookings?.filter(b => 
    activeStatuses.includes(b.status || '') && 
    b.status !== 'completed' && 
    b.status !== 'cancelled'
  ) || [];
  
  // Upcoming rides: scheduled for future, not yet active
  const upcomingOnlyBookings = bookings?.filter(b => 
    b.status === 'pending' && 
    new Date(b.scheduledDateTime) >= now
  ) || [];
  
  // Combine active (first) and upcoming bookings
  const upcomingBookings = [...activeBookings, ...upcomingOnlyBookings];
  
  // Past rides: completed or cancelled
  const pastBookings = bookings?.filter(b => 
    b.status === 'completed' || b.status === 'cancelled'
  ) || [];

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'on_the_way': return 'bg-indigo-100 text-indigo-800 animate-pulse';
      case 'arrived': return 'bg-cyan-100 text-cyan-800 animate-pulse';
      case 'on_board': return 'bg-purple-100 text-purple-800 animate-pulse';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string | null) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const menuItems = [
    { id: 'home' as Section, label: 'Home', icon: Home },
    { id: 'new-booking' as Section, label: 'New Booking', icon: Plus },
    { id: 'saved-locations' as Section, label: 'Saved', icon: MapPin },
    { id: 'invoices' as Section, label: 'Invoices', icon: FileText },
    { id: 'payment' as Section, label: 'Payment', icon: CreditCard },
    { id: 'account' as Section, label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 pb-20">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-xl">
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="text-blue-100 mt-1 text-sm">{user.firstName || ''} {user.lastName || ''}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white hover:bg-white/20"
                data-testid="button-menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
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
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-blue-100 text-xs">Active</p>
              <p className="text-xl font-bold mt-1">{upcomingBookings.filter(b => ['confirmed', 'on_the_way', 'arrived', 'on_board'].includes(b.status || '')).length}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-blue-100 text-xs">Upcoming</p>
              <p className="text-xl font-bold mt-1">{upcomingBookings.length}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-blue-100 text-xs">Total</p>
              <p className="text-xl font-bold mt-1">{bookings?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-4 pt-2 pb-0 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setMenuOpen(false); }}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-t-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-slate-50 via-white to-blue-50/20 text-blue-600 shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                  <span className={`text-xs font-medium whitespace-nowrap ${isActive ? 'text-blue-700' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Home Section */}
        {activeSection === 'home' && (
          <>
            {/* Quick Action Button */}
            <Button
              onClick={() => setActiveSection('new-booking')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 rounded-2xl text-lg font-semibold shadow-lg transition-all transform active:scale-95"
              data-testid="button-new-booking-home"
            >
              <Plus className="w-6 h-6 mr-2" />
              Book New Ride
            </Button>

            {/* Bookings Section */}
            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  My Rides
                </CardTitle>
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

            
          </>
        )}

        {/* New Booking Section */}
        {activeSection === 'new-booking' && (
          <div className="space-y-4">
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Create New Booking
                </CardTitle>
                <CardDescription>Book your luxury ride</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Button
                    onClick={() => navigate('/mobile-booking')}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    data-testid="button-start-booking"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Start Booking Process
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Saved Locations Section */}
        {activeSection === 'saved-locations' && (
          <div className="space-y-4">
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Saved Locations
                </CardTitle>
                <CardDescription>Quick access to your favorite places</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No saved locations yet</p>
                  <p className="text-sm mt-2">Save locations during booking for quick access</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invoices Section */}
        {activeSection === 'invoices' && (
          <div className="space-y-4">
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  My Invoices
                </CardTitle>
                <CardDescription>View and manage your invoices</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Button
                    onClick={() => navigate('/mobile-invoices')}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    data-testid="button-view-invoices"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    View All Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Section */}
        {activeSection === 'payment' && (
          <div className="space-y-4">
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Manage your payment options</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Button
                    onClick={() => navigate('/mobile-payment-methods')}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    data-testid="button-manage-payment"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Manage Payment Methods
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Section */}
        {activeSection === 'account' && (
          <div className="space-y-4">
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Account Settings
                </CardTitle>
                <CardDescription>Manage your profile</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-base font-medium mt-1">{user.firstName} {user.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-base font-medium mt-1">{user.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-base font-medium mt-1">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Username</label>
                      <p className="text-base font-medium mt-1">{user.username}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
