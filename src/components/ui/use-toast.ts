
// The issue is that we're importing 'toast' as an object with methods,
// but using it as a function in the VideoAnalysis component.
// Let's update this file to reflect the correct usage.

import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };
