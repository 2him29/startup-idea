import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

interface DonorRegistrationProps {
  onBack: () => void;
}

export function DonorRegistration({ onBack }: DonorRegistrationProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    bloodType: "",
    weight: "",
    lastDonation: "",
    medicallyEligible: false,
    agreedToTerms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Registration submitted! (Demo only)");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-red-50 to-white p-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Button>
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <h2 className="text-red-600">Donor Registration</h2>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 mb-6 bg-red-50 border-red-200">
        <p className="text-slate-700">
          Complete this form to register as a blood donor. Your information will help us match you with patients in need.
        </p>
      </Card>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6 border-red-100">
          <h3 className="text-red-600">Personal Information</h3>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloodType">Blood Type *</Label>
            <Select
              value={formData.bloodType}
              onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
            >
              <SelectTrigger id="bloodType">
                <SelectValue placeholder="Select your blood type" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="lastDonation">Last Donation Date</Label>
            <Input
              id="lastDonation"
              type="date"
              value={formData.lastDonation}
              onChange={(e) => setFormData({ ...formData, lastDonation: e.target.value })}
            />
            <p className="text-muted-foreground">Leave blank if first-time donor</p>
          </div>
        </Card>

        <Card className="p-6 space-y-6 border-red-100">
          <h3 className="text-red-600">Medical Eligibility</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="medicallyEligible"
                checked={formData.medicallyEligible}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, medicallyEligible: checked as boolean })
                }
              />
              <div className="space-y-1">
                <Label htmlFor="medicallyEligible" className="cursor-pointer">
                  I confirm that I am medically eligible to donate blood
                </Label>
                <p className="text-muted-foreground">
                  You should be in good health, weigh at least 50kg, and be between 18-65 years old
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="agreedToTerms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, agreedToTerms: checked as boolean })
                }
              />
              <div className="space-y-1">
                <Label htmlFor="agreedToTerms" className="cursor-pointer">
                  I agree to the terms and conditions
                </Label>
                <p className="text-muted-foreground">
                  Your information will be kept confidential and used only for donation purposes
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600"
            disabled={!formData.medicallyEligible || !formData.agreedToTerms}
          >
            Complete Registration
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full border-red-200"
            onClick={onBack}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
