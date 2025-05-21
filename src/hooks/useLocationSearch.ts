
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LocationSuggestion {
  id: string;
  name: string;
  city?: string;
  country?: string;
}

export function useLocationSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
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

  // Mock location data - in a real app, you would fetch this from a geocoding API
  const mockLocations = [
    { id: '1', name: 'London', city: 'London', country: 'United Kingdom' },
    { id: '2', name: 'Liverpool', city: 'Liverpool', country: 'United Kingdom' },
    { id: '3', name: 'Manchester', city: 'Manchester', country: 'United Kingdom' },
    { id: '4', name: 'Birmingham', city: 'Birmingham', country: 'United Kingdom' },
    { id: '5', name: 'Leeds', city: 'Leeds', country: 'United Kingdom' },
    { id: '6', name: 'Glasgow', city: 'Glasgow', country: 'United Kingdom' },
    { id: '7', name: 'Edinburgh', city: 'Edinburgh', country: 'United Kingdom' },
    { id: '8', name: 'Bristol', city: 'Bristol', country: 'United Kingdom' },
    { id: '9', name: 'Cardiff', city: 'Cardiff', country: 'United Kingdom' },
    { id: '10', name: 'Newcastle', city: 'Newcastle', country: 'United Kingdom' },
  ];

  const searchLocations = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // In a real app, this would be an API call to a geocoding service
        // For now, we'll use our mock data and filter it
        const results = mockLocations.filter(location => 
          location.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching locations:', error);
        toast({
          title: 'Search Error',
          description: 'Unable to search locations. Please try again.',
          variant: 'destructive',
        });
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [toast]
  );

  useEffect(() => {
    searchLocations(query);
  }, [query, searchLocations]);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
  };
}
