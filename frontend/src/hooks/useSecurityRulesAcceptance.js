import { useState, useEffect } from 'react';

const STORAGE_KEY = 'journey_security_rules_accepted';

export function useSecurityRulesAcceptance() {
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      setHasAcceptedRules(accepted === 'true');
    } catch (error) {
      console.warn('Erreur lors de la lecture du localStorage:', error);
      setHasAcceptedRules(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptRules = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      setHasAcceptedRules(true);
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  };

  const resetAcceptance = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasAcceptedRules(false);
    } catch (error) {
      console.warn('Erreur lors de la suppression du localStorage:', error);
    }
  };

  return {
    hasAcceptedRules,
    isLoading,
    acceptRules,
    resetAcceptance
  };
}