'use client';

/**
 * Stacks Wallet Provider for HyperInsure
 * 
 * This component provides Stacks wallet connection functionality
 * using @stacks/connect-react for the insurance application.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Connect, AuthOptions, useConnect } from '@stacks/connect-react';
import { UserSession, AppConfig } from '@stacks/auth';
import { StacksTestnet, StacksMainnet, StacksNetwork } from '@stacks/network';
import { APP_CONFIG } from './stacks-config';

// Types
interface StacksContextType {
  userSession: UserSession;
  isConnected: boolean;
  userAddress: string | null;
  disconnect: () => void;
  network: StacksNetwork;
}

// Context
const StacksContext = createContext<StacksContextType | null>(null);

// Hook to use Stacks context
export const useStacks = () => {
  const context = useContext(StacksContext);
  if (!context) {
    throw new Error('useStacks must be used within a StacksProvider');
  }
  return context;
};

// App configuration for Stacks Connect
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

interface StacksProviderProps {
  children: React.ReactNode;
}

export const StacksProvider: React.FC<StacksProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Initialize network with API URL
  const network = APP_CONFIG.NETWORK === 'mainnet' 
    ? new StacksMainnet({ url: 'https://api.hiro.so' })
    : new StacksTestnet({ url: APP_CONFIG.STACKS_API_URL || 'https://api.testnet.hiro.so' });

  // Check if user is already signed in on mount
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    try {
    if (userSession.isUserSignedIn()) {
      setIsConnected(true);
      const userData = userSession.loadUserData();
      const address = userData.profile?.stxAddress?.[APP_CONFIG.NETWORK] || 
                      userData.profile?.stxAddress?.testnet ||
                      userData.profile?.stxAddress?.mainnet;
      setUserAddress(address || null);
      
      if (APP_CONFIG.DEBUG_MODE) {
        console.log('User already connected:', address);
      }
      }
    } catch (error) {
      // Handle corrupted session data
      console.error('Error loading session data:', error);
      // Clear corrupted session data
      try {
        userSession.signUserOut();
      } catch (signOutError) {
        // If sign out fails, try to clear localStorage directly
        if (typeof window !== 'undefined') {
          localStorage.removeItem('blockstack-session');
          localStorage.removeItem('blockstack');
        }
      }
      setIsConnected(false);
      setUserAddress(null);
    }
  }, []);

  // Disconnect wallet function
  const disconnect = useCallback(() => {
    userSession.signUserOut();
    setIsConnected(false);
    setUserAddress(null);
    window.location.reload();
  }, []);

  // Auth options for Stacks Connect
  const authOptions: AuthOptions = {
    appDetails: {
      name: 'HyperInsure',
      icon: typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '/logo.png',
    },
    redirectTo: '/',
    onFinish: () => {
      try {
      setIsConnected(true);
      const userData = userSession.loadUserData();
      const address = userData.profile?.stxAddress?.[APP_CONFIG.NETWORK] || 
                      userData.profile?.stxAddress?.testnet ||
                      userData.profile?.stxAddress?.mainnet;
      setUserAddress(address || null);
      
      if (APP_CONFIG.DEBUG_MODE) {
        console.log('User connected:', address);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setIsConnected(false);
        setUserAddress(null);
      }
    },
    onCancel: () => {
      console.log('User cancelled connection');
    },
    userSession,
  };

  const contextValue: StacksContextType = {
    userSession,
    isConnected,
    userAddress,
    disconnect,
    network,
  };

  return (
    <Connect authOptions={authOptions}>
      <StacksContext.Provider value={contextValue}>
        {children}
      </StacksContext.Provider>
    </Connect>
  );
};

// Wallet connection button component
interface ConnectWalletButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ 
  className = '', 
  children = 'Connect Wallet' 
}) => {
  const { isConnected, userAddress, disconnect } = useStacks();
  const { doOpenAuth } = useConnect();

  const handleConnect = async () => {
    try {
      await doOpenAuth();
    } catch (error: any) {
      // Silently handle user cancellation - this is expected behavior
      if (error?.message === 'cancel' || error === 'cancel') {
        // User cancelled, do nothing
        return;
      }
      // Log other errors for debugging
      console.error('Wallet connection error:', error);
    }
  };

  if (isConnected && userAddress) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-muted-foreground px-3 py-1 bg-white/10 rounded-full">
          {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className={`px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 font-medium ${className}`}
    >
      {children}
    </button>
  );
};
