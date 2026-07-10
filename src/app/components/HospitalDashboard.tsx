import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Search, Filter, Droplet, Clock, MapPin } from "lucide-react";
import { useState } from "react";

interface HospitalDashboardProps {
  onBack: () => void;
}

const mockRequests = [
  {
    id: 1,
    patientId: "P-2024-001",
    bloodType: "A+",
    units: 2,
    urgency: "Critical",
    hospital: "City General Hospital",
    location: "2.3 km away",
    time: "30 mins ago",
    status: "Active",
  },
  {
    id: 2,
    patientId: "P-2024-002",
    bloodType: "O-",
    units: 3,
    urgency: "High",
    hospital: "Memorial Medical Center",
    location: "4.1 km away",
    time: "1 hour ago",
    status: "Active",
  },
  {
    id: 3,
    patientId: "P-2024-003",
    bloodType: "B+",
    units: 1,
    urgency: "Medium",
    hospital: "St. Mary's Hospital",
    location: "5.7 km away",
    time: "3 hours ago",
    status: "Active",
  },
  {
    id: 4,
    patientId: "P-2024-004",
    bloodType: "AB+",
    units: 2,
    urgency: "Low",
    hospital: "County Hospital",
    location: "8.2 km away",
    time: "5 hours ago",
    status: "Pending",
  },
];

export function HospitalDashboard({ onBack }: HospitalDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBloodType, setFilterBloodType] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return "bg-red-500 text-white";
      case "High":
        return "bg-orange-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-white";
      case "Low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const filteredRequests = mockRequests.filter((request) => {
    const matchesSearch =
      request.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBloodType =
      filterBloodType === "all" || request.bloodType === filterBloodType;
    const matchesUrgency =
      filterUrgency === "all" || request.urgency === filterUrgency;
    return matchesSearch && matchesBloodType && matchesUrgency;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-emerald-700" />
        </Button>
        <h2 className="text-emerald-900">Blood Requests</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-3 text-center">
          <p className="text-muted-foreground">Total</p>
          <h3 className="text-emerald-600">{mockRequests.length}</h3>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-muted-foreground">Active</p>
          <h3 className="text-cyan-600">
            {mockRequests.filter((r) => r.status === "Active").length}
          </h3>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-muted-foreground">Critical</p>
          <h3 className="text-red-600">
            {mockRequests.filter((r) => r.urgency === "Critical").length}
          </h3>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient ID or hospital..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-emerald-600" />
              <p className="text-emerald-900">Blood Type</p>
            </div>
            <Select value={filterBloodType} onValueChange={setFilterBloodType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <p className="text-emerald-900">Urgency</p>
            </div>
            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-emerald-900">All Requests</h3>
          <p className="text-muted-foreground">
            {filteredRequests.length} result{filteredRequests.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredRequests.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Droplet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-emerald-900">{request.patientId}</h4>
                  <p className="text-muted-foreground">{request.hospital}</p>
                </div>
              </div>
              <Badge className={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                  <p className="text-red-700">{request.bloodType}</p>
                </div>
                <p className="text-muted-foreground">{request.units} unit{request.units > 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <p>{request.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <p>{request.location}</p>
            </div>

            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              View Details
            </Button>
          </Card>
        ))}
      </div>

      {/* New Request Button */}
      <div className="fixed bottom-24 right-6">
        <Button size="lg" className="rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 h-14 px-6">
          + New Request
        </Button>
      </div>
    </div>
  );
}
