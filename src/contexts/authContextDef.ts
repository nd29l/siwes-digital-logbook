/**
 * @file src/contexts/authContextDef.ts
 * @description React Context definition for Auth to satisfy React Fast Refresh isolated exports rule.
 */

import { createContext } from 'react';
import { AuthContextType } from '@/types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
