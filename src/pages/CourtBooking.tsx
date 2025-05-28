
import { CourtBookingSystem } from "@/components/CourtBookingSystem";

const CourtBooking = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book a Padel Court</h1>
        <p className="text-gray-600">Find and book padel courts at top clubs near you</p>
      </div>
      
      <CourtBookingSystem />
    </div>
  );
};

export default CourtBooking;
