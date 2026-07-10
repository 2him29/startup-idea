import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
  ArrowLeft,
  User,
  Droplet,
  Calendar,
  Award,
  Bell,
  Settings,
  ChevronRight,
  Heart,
} from "lucide-react";
import { Logo } from "./Logo";

interface ProfileScreenProps {
  onBack: () => void;
  userType: "donor" | "hospital" | null;
}

const donationHistory = [
  {
    id: 1,
    date: "March 15, 2025",
    location: "City General Hospital",
    units: 1,
    type: "Whole Blood",
  },
  {
    id: 2,
    date: "December 10, 2024",
    location: "Memorial Medical Center",
    units: 1,
    type: "Whole Blood",
  },
  {
    id: 3,
    date: "September 5, 2024",
    location: "St. Mary's Hospital",
    units: 1,
    type: "Platelets",
  },
];

export function ProfileScreen({ onBack, userType }: ProfileScreenProps) {
  const isDonor = userType === "donor";

  return (
    <div className={`flex flex-col min-h-screen bg-gradient-to-b ${isDonor ? 'from-red-50 via-pink-50' : 'from-cyan-50'} to-white p-6 pb-24`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Button>
        <Logo size={28} className="mr-1" />
        <h2 className={isDonor ? "text-red-600" : "text-cyan-600"}>Profile</h2>
      </div>

      {/* Profile Card */}
      <Card className={`p-6 mb-6 bg-gradient-to-r ${isDonor ? 'from-red-500 to-pink-500' : 'from-cyan-500 to-blue-500'} border-0 shadow-lg`}>
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-20 h-20 border-4 border-white/30">
            <AvatarFallback className="bg-white text-2xl" style={{ color: isDonor ? '#ef4444' : '#0891b2' }}>
              {isDonor ? "JD" : "HO"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-white">
              {isDonor ? "John Doe" : "Hospital Admin"}
            </h2>
            <p className="text-white/80">
              {isDonor ? "john.doe@email.com" : "admin@hospital.com"}
            </p>
            {isDonor && (
              <Badge className="mt-2 bg-white/20 text-white border-white/30">
                Blood Type: A+
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {isDonor ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-4 text-center border-red-100">
              <Droplet className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <h3 className="text-red-600">12</h3>
              <p className="text-muted-foreground">Donations</p>
            </Card>
            <Card className="p-4 text-center border-red-100">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <h3 className="text-red-600">36</h3>
              <p className="text-muted-foreground">Lives Saved</p>
            </Card>
            <Card className="p-4 text-center border-red-100">
              <Award className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <h3 className="text-red-600">3</h3>
              <p className="text-muted-foreground">Badges</p>
            </Card>
          </div>

          {/* Next Donation */}
          <Card className="p-4 mb-6 border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-red-500" />
              <h3 className="text-red-600">Next Eligible Donation</h3>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-red-900">May 15, 2025</p>
              <p className="text-muted-foreground">56 days from last donation</p>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-4 mb-6 border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-red-500" />
              <h3 className="text-red-600">Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="urgent-requests">Urgent blood requests</Label>
                <Switch id="urgent-requests" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="donation-reminders">Donation reminders</Label>
                <Switch id="donation-reminders" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="nearby-hospitals">Nearby hospitals</Label>
                <Switch id="nearby-hospitals" />
              </div>
            </div>
          </Card>

          {/* Donation History */}
          <Card className="p-4 mb-6 border-red-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-red-600">Donation History</h3>
              <Button variant="ghost" size="sm" className="text-red-500">
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {donationHistory.map((donation, index) => (
                <div key={donation.id}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Droplet className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-slate-900">{donation.location}</h4>
                        <p className="text-muted-foreground">{donation.units}u</p>
                      </div>
                      <p className="text-muted-foreground">{donation.date}</p>
                      <Badge variant="outline" className="mt-1 border-red-200">
                        {donation.type}
                      </Badge>
                    </div>
                  </div>
                  {index < donationHistory.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Hospital Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-4 text-center">
              <h3 className="text-emerald-600">156</h3>
              <p className="text-muted-foreground">Total Requests</p>
            </Card>
            <Card className="p-4 text-center">
              <h3 className="text-cyan-600">8</h3>
              <p className="text-muted-foreground">Active</p>
            </Card>
          </div>

          {/* Hospital Settings */}
          <Card className="p-4 mb-6">
            <h3 className="text-emerald-900 mb-4">Hospital Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-match">Auto-match donors</Label>
                <Switch id="auto-match" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Email notifications</Label>
                <Switch id="notifications" defaultChecked />
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Menu Items */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-4 px-4"
        >
          <div className="flex items-center gap-3">
            <User className={`w-5 h-5 ${isDonor ? 'text-red-500' : 'text-cyan-600'}`} />
            <p className="text-slate-900">Edit Profile</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-4 px-4"
        >
          <div className="flex items-center gap-3">
            <Settings className={`w-5 h-5 ${isDonor ? 'text-red-500' : 'text-cyan-600'}`} />
            <p className="text-slate-900">Settings</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Button>

        <Separator className="my-4" />

        <Button variant="ghost" className="w-full text-red-600 justify-start h-auto py-4 px-4">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
