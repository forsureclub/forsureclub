
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [allPlayersPaid, setAllPlayersPaid] = useState(false);
  const { toast } = useToast();

  const sessionId = searchParams.get("session_id");
  const matchId = searchParams.get("match_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !matchId) {
        setVerifying(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId, matchId }
        });

        if (error) throw error;

        setPaymentVerified(data.success);
        setAllPlayersPaid(data.allPlayersPaid);

        if (data.success) {
          toast({
            title: "Payment Successful!",
            description: data.allPlayersPaid 
              ? "All players have paid. Your court booking is being processed."
              : "Your payment was successful. Waiting for other players to pay.",
          });
        }
      } catch (error: any) {
        toast({
          title: "Payment Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, matchId, toast]);

  if (verifying) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
      <Card className="p-8 text-center max-w-md w-full">
        {paymentVerified ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              {allPlayersPaid 
                ? "All players have paid successfully. Your court booking is being processed and you'll receive confirmation shortly."
                : "Your payment was successful! We're now waiting for the other players to complete their payments before booking the court."
              }
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Issue</h1>
            <p className="text-gray-600 mb-6">
              There was an issue verifying your payment. Please contact support if you believe this is an error.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
