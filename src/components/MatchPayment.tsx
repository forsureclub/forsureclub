
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, CreditCard, Clock, Pound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface MatchPaymentProps {
  matchId: string;
  timeSlot: string;
  sport: string;
  location: string;
  playedAt: string;
  onPaymentComplete: () => void;
}

export const MatchPayment = ({ 
  matchId, 
  timeSlot, 
  sport, 
  location, 
  playedAt,
  onPaymentComplete 
}: MatchPaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  const calculateDisplayPrice = (timeSlot: string): string => {
    const basePrice = 10;
    const hour = parseInt(timeSlot.split(':')[0]);
    const isPeakHour = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 21);
    return isPeakHour ? (basePrice * 1.5).toFixed(2) : basePrice.toFixed(2);
  };

  const handlePayment = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get current player profile
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("email", user.email)
        .single();

      if (playerError || !player) {
        throw new Error("Player profile not found");
      }

      const { data, error } = await supabase.functions.invoke("process-match-payment", {
        body: {
          matchId,
          timeSlot,
          playerId: player.id
        }
      });

      if (error) throw error;

      setPrice(data.price);

      // Redirect to Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = calculateDisplayPrice(timeSlot);
  const isPeakHour = timeSlot && (
    (parseInt(timeSlot.split(':')[0]) >= 6 && parseInt(timeSlot.split(':')[0]) <= 9) ||
    (parseInt(timeSlot.split(':')[0]) >= 17 && parseInt(timeSlot.split(':')[0]) <= 21)
  );

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-green-900">Match Payment Required</h3>
          <p className="text-green-700">All players have confirmed - time to secure your spot!</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3">Match Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sport:</span>
              <span className="font-medium">{sport}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium">
                {new Date(playedAt).toLocaleDateString()} at {timeSlot}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pound className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Your Payment:</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">£{displayPrice}</div>
              {isPeakHour && (
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <Clock className="h-3 w-3" />
                  <span>Peak hour rate</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay £{displayPrice} with Stripe
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Your court will only be booked once all players have completed payment.
          Secure payment processing by Stripe.
        </p>
      </div>
    </Card>
  );
};
