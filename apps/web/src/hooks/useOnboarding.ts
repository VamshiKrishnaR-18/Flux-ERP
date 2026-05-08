import { useState, useEffect } from 'react';
import { api } from '../lib/axios';
import { useAuth } from './useAuth';

export function useOnboarding() {
  const { user } = useAuth();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || user.role !== 'admin') {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/settings');
        const settings = res.data.data;
        
        // If company name is not set, we should show onboarding
        if (!settings || !settings.companyName) {
          setShouldShowOnboarding(true);
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [user]);

  const completeOnboarding = () => {
    setShouldShowOnboarding(false);
  };

  return { shouldShowOnboarding, isLoading, completeOnboarding };
}
