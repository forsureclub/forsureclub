
import { useState, useEffect } from "react";
import { ClubManagement } from "@/components/ClubManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Users, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const ClubDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    revenue: 0,
    activeMembers: 0,
    courtUtilization: 0,
    todaysBookings: 0,
    weeklyRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch booking statistics
      const { data: bookings, error: bookingsError } = await supabase
        .from("court_bookings")
        .select("*")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (bookingsError) throw bookingsError;

      // Calculate stats
      const totalBookings = bookings?.length || 0;
      const revenue = bookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
      const todaysBookings = bookings?.filter(booking => 
        new Date(booking.booking_date).toDateString() === new Date().toDateString()
      ).length || 0;

      setStats({
        totalBookings,
        revenue,
        activeMembers: 145, // Mock data
        courtUtilization: 78, // Mock data
        todaysBookings,
        weeklyRevenue: revenue * 0.3, // Mock calculation
      });

      setRecentBookings(bookings?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Padel Club Dashboard</h1>
        <Button className="bg-orange-600 hover:bg-orange-700">
          View Public Profile
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.todaysBookings} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +£{stats.weeklyRevenue.toFixed(2)} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Court Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courtUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="courts">Courts & Facilities</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.map((booking: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Padel Court {booking.court_id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.start_time).toLocaleDateString()} at{" "}
                          {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">£{booking.total_price || 35}</p>
                        <p className="text-sm text-green-600">{booking.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">6:00 - 9:00 AM</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-3/4 h-2 bg-orange-500 rounded"></div>
                      </div>
                      <span className="text-sm">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">12:00 - 2:00 PM</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-1/2 h-2 bg-blue-500 rounded"></div>
                      </div>
                      <span className="text-sm">50%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">6:00 - 9:00 PM</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-full h-2 bg-green-500 rounded"></div>
                      </div>
                      <span className="text-sm">95%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <BookingsManagement />
        </TabsContent>

        <TabsContent value="courts">
          <ClubManagement />
        </TabsContent>

        <TabsContent value="members">
          <MembersManagement />
        </TabsContent>

        <TabsContent value="settings">
          <ClubSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const BookingsManagement = () => (
  <Card>
    <CardHeader>
      <CardTitle>Booking Management</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Booking management features coming soon...</p>
    </CardContent>
  </Card>
);

const MembersManagement = () => (
  <Card>
    <CardHeader>
      <CardTitle>Members Management</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Members management features coming soon...</p>
    </CardContent>
  </Card>
);

const ClubSettings = () => (
  <Card>
    <CardHeader>
      <CardTitle>Club Settings</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Club settings coming soon...</p>
    </CardContent>
  </Card>
);

export default ClubDashboard;
