"use client";

import { useState, useEffect } from 'react';
import { getCurrentUserProfileAction } from '@/actions/profiles-actions';

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setIsLoading(true);
        const result = await getCurrentUserProfileAction();
        if (result.isSuccess && result.data) {
          setIsAdmin(result.data.membership === 'admin');
        } else {
          setIsAdmin(false);
          setError(result.message || 'Failed to fetch user profile');
        }
      } catch (err) {
        setIsAdmin(false);
        setError(err instanceof Error ? err.message : 'Unknown error checking admin status');
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading, error };
} 