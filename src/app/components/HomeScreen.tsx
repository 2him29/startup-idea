import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Heart, Droplet, Users, Bell } from "lucide-react";
import { Badge } from "./ui/badge";
import { Logo } from "./Logo";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  userType: "donor" | "hospital" | null;
  onSetUserType: (type: "donor" | "hospital") => void;
}

export function HomeScreen({ onNavigate, userType, onSetUserType }: HomeScreenProps) {
  if (!userType) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-red-50 via-pink-50 to-cyan-50 p-6">
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Logo size={56} />
            <h1 className="text-red-600">WeAre</h1>
          </div>
          <p className="text-slate-700 text-center max-w-xs">
            Connect donors with hospitals to save lives through blood donation
          </p>
          
          <div className="w-full max-w-sm space-y-4 mt-8">
            <Card className="p-6 border-2 border-red-200 bg-gradient-to-br from-white to-red-50">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-8 h-8 text-red-500" />
                <h3 className="text-red-900">I'm a Donor</h3>
              </div>
              <p className="text-slate-700 mb-4">Help save lives by donating blood</p>
              <Button 
                onClick={() => onSetUserType("donor")}
                className="w-full bg-red-500 hover:bg-red-600"
              >
                Continue as Donor
              </Button>
            </Card>

            <Card className="p-6 border-2 border-cyan-200 bg-gradient-to-br from-white to-cyan-50">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-cyan-600" />
                <h3 className="text-cyan-900">I'm a Hospital</h3>
              </div>
              <p className="text-slate-700 mb-4">Find donors for your patients</p>
              <Button 
                onClick={() => onSetUserType("hospital")}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Continue as Hospital
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-red-50 via-pink-50 to-white p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Logo size={36} />
          <h2 className="text-red-600">WeAre</h2>
        </div>
        <div className="relative">
          <Bell className="w-6 h-6 text-slate-700" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-red-500 to-pink-500 border-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/90">Welcome back,</p>
            <h2 className="text-white">
              {userType === "donor" ? "Donor" : "Hospital Staff"}
            </h2>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            {userType === "donor" ? "A+" : "Active"}
          </Badge>
        </div>
      </Card>

      {/* Quick Stats */}
      {userType === "donor" && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 border-red-100">
            <p className="text-muted-foreground">Total Donations</p>
            <h3 className="text-red-600">12</h3>
          </Card>
          <Card className="p-4 border-red-100">
            <p className="text-muted-foreground">Lives Saved</p>
            <h3 className="text-red-500">36</h3>
          </Card>
        </div>
      )}

      {/* Main Actions */}
      <div className="space-y-4 mb-6">
        <h3 className="text-slate-900">Quick Actions</h3>
        
        {userType === "donor" ? (
          <>
            <Button
              onClick={() => onNavigate("matching")}
              className="w-full h-auto py-6 bg-red-500 hover:bg-red-600 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Droplet className="w-6 h-6" />
                <div className="text-left">
                  <p>Find Urgent Requests</p>
                  <p className="opacity-80">See who needs your help</p>
                </div>
              </div>
              <Badge className="bg-red-700 text-white">3</Badge>
            </Button>

            <Button
              onClick={() => onNavigate("profile")}
              variant="outline"
              className="w-full h-auto py-6 border-2 border-red-200 flex items-center gap-3 justify-start"
            >
              <Heart className="w-6 h-6 text-red-500" />
              <div className="text-left">
                <p className="text-slate-900">Update Availability</p>
                <p className="text-slate-600">Manage your donation schedule</p>
              </div>
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => onNavigate("hospital")}
              className="w-full h-auto py-6 bg-cyan-600 hover:bg-cyan-700 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                <div className="text-left">
                  <p>View Requests</p>
                  <p className="opacity-80">Manage blood requests</p>
                </div>
              </div>
              <Badge className="bg-white/20">8</Badge>
            </Button>

            <Button
              onClick={() => onNavigate("matching")}
              variant="outline"
              className="w-full h-auto py-6 border-2 border-cyan-200 flex items-center gap-3 justify-start"
            >
              <Droplet className="w-6 h-6 text-cyan-600" />
              <div className="text-left">
                <p className="text-slate-900">Find Donors</p>
                <p className="text-slate-600">Search available donors</p>
              </div>
            </Button>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h3 className="text-slate-900">Recent Activity</h3>
        <Card className="p-4 border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900">
                {userType === "donor" ? "Donation scheduled" : "New donor match"}
              </p>
              <p className="text-muted-foreground">2 hours ago</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
