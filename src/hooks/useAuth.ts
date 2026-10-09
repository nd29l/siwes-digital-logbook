/**
 * @file src/hooks/useAuth.ts
 * @description Hook to consume AuthContext safely with Fast Refresh compliance.
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContextDef';
import { AuthContextType } from '@/types';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
