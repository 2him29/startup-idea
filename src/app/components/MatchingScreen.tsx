import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, MapPin, Phone, Navigation, Droplet, Clock } from "lucide-react";
import { Logo } from "./Logo";

interface MatchingScreenProps {
  onBack: () => void;
  userType: "donor" | "hospital" | null;
}

const mockDonors = [
  {
    id: 1,
    name: "Sarah Johnson",
    bloodType: "A+",
    distance: "1.2 km",
    availability: "Available Now",
    donations: 8,
    verified: true,
  },
  {
    id: 2,
    name: "Michael Chen",
    bloodType: "A+",
    distance: "2.5 km",
    availability: "Available Today",
    donations: 15,
    verified: true,
  },
  {
    id: 3,
    name: "Emily Davis",
    bloodType: "A+",
    distance: "3.1 km",
    availability: "Available Tomorrow",
    donations: 5,
    verified: true,
  },
];

const mockRequests = [
  {
    id: 1,
    hospital: "City General Hospital",
    bloodType: "A+",
    units: 2,
    urgency: "Critical",
    distance: "2.3 km",
    time: "30 mins ago",
  },
  {
    id: 2,
    hospital: "Memorial Medical Center",
    bloodType: "O-",
    units: 3,
    urgency: "High",
    distance: "4.1 km",
    time: "1 hour ago",
  },
  {
    id: 3,
    hospital: "St. Mary's Hospital",
    bloodType: "B+",
    units: 1,
    urgency: "Medium",
    distance: "5.7 km",
    time: "2 hours ago",
  },
];

export function MatchingScreen({ onBack, userType }: MatchingScreenProps) {
  const isDonor = userType === "donor";

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-red-50 via-pink-50 to-white pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Button>
        <Logo size={28} className="mr-1" />
        <h2 className={isDonor ? "text-red-600" : "text-cyan-600"}>
          {isDonor ? "Urgent Requests" : "Available Donors"}
        </h2>
      </div>

      {/* Map Preview */}
      <div className="px-6 mb-6">
        <Card className={`h-48 bg-gradient-to-br ${isDonor ? 'from-red-100 to-pink-100 border-2 border-red-200' : 'from-cyan-100 to-blue-100 border-2 border-cyan-200'} relative overflow-hidden`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Navigation className={`w-16 h-16 ${isDonor ? 'text-red-400' : 'text-cyan-400'} opacity-50`} />
          </div>
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2">
            <p className={isDonor ? "text-red-600" : "text-cyan-600"}>Map View</p>
            <p className="text-muted-foreground">
              {isDonor ? mockRequests.length : mockDonors.length} nearby
            </p>
          </div>
          {/* Mock map markers */}
          <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md" />
          <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md" />
          <div className="absolute top-2/3 left-2/3 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md" />
        </Card>
      </div>

      {/* List */}
      <div className="px-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className={isDonor ? "text-red-600" : "text-cyan-600"}>
            {isDonor ? "Requests Near You" : "Matched Donors"}
          </h3>
          <Button variant="ghost" size="sm" className={isDonor ? "text-red-500" : "text-cyan-500"}>
            <MapPin className="w-4 h-4 mr-1" />
            Sort by distance
          </Button>
        </div>

        {isDonor ? (
          // Donor view - show requests
          mockRequests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                    <Droplet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-cyan-900">{request.hospital}</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <p>{request.distance}</p>
                    </div>
                  </div>
                </div>
                <Badge
                  className={
                    request.urgency === "Critical"
                      ? "bg-red-500 text-white"
                      : request.urgency === "High"
                      ? "bg-orange-500 text-white"
                      : "bg-yellow-500 text-white"
                  }
                >
                  {request.urgency}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-cyan-100 flex items-center justify-center">
                    <p className="text-cyan-700">{request.bloodType}</p>
                  </div>
                  <p className="text-muted-foreground">
                    {request.units} unit{request.units > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <p>{request.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-red-200">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button className="bg-red-500 hover:bg-red-600">
                  Respond
                </Button>
              </div>
            </Card>
          ))
        ) : (
          // Hospital view - show donors
          mockDonors.map((donor) => (
            <Card key={donor.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-emerald-400 text-white">
                      {donor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-emerald-900">{donor.name}</h4>
                      {donor.verified && (
                        <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <p>{donor.distance}</p>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <p className="text-red-700">{donor.bloodType}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  {donor.availability}
                </Badge>
                <p className="text-muted-foreground">
                  {donor.donations} donations
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-emerald-200">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Request
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
