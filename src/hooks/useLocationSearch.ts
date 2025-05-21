
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface LocationSuggestion {
  id: string;
  name: string;
  city?: string;
  country?: string;
}

// Mapbox access token - this is a public token so it's okay to include in the code
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1nZW9jb2RpbmciLCJhIjoiY2xza3hvbWhkMHd5ZDJqcDhieXEwcjAzeSJ9.lZksHq7A6fwJQBwpxZ5k5w';

export function useLocationSearch() {
  const [query, setQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Debounce function to prevent too many API calls
  const debounce = (func: Function, delay: number) => {
    let timeout: NodeJS.Timeout;
    
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // Search locations using Mapbox Geocoding API with UK focus
  const fetchLocationSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setLocationSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Mapbox geocoding API endpoint with focus on the UK
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
        const params = new URLSearchParams({
          access_token: MAPBOX_ACCESS_TOKEN,
          country: 'gb', // Focus on Great Britain
          types: 'place,locality,neighborhood',
          autocomplete: 'true',
          language: 'en',
          limit: '10'
        });

        const response = await fetch(`${endpoint}?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform Mapbox response to simple strings
        const locations: string[] = data.features.map((feature: any) => {
          return feature.place_name;
        });

        setLocationSuggestions(locations);
      } catch (error) {
        console.error('Error searching locations:', error);
        toast({
          title: 'Search Error',
          description: 'Unable to search locations. Please try again.',
          variant: 'destructive',
        });
        setLocationSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [toast]
  );

  // Trigger location search when query changes
  useEffect(() => {
    fetchLocationSuggestions(query);
  }, [query, fetchLocationSuggestions]);

  return {
    query,
    setQuery,
    locationSuggestions,
    fetchLocationSuggestions,
    isLoading,
  };
}
