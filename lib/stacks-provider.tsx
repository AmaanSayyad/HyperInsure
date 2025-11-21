'use client';

/**
 * Stacks Wallet Provider for HyperInsure
 * 
 * This component provides Stacks wallet connection functionality
 * using @stacks/connect-react for the insurance application.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Connect } from '@stacks/connect-react';
import { UserSession, AppConfig } from '@stacks/auth';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { APP_CONFIG } from './stacks-config';

// Types
interface StacksContextType {
  userSession: UserSession | null;
  isConnected: boolean;
  userAddress: string | null;
  connect: () => void;
  disconnect: () => void;
  network: StacksTestnet | StacksMainnet;
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

interface StacksProviderProps {
  children: React.ReactNode;
}

export const StacksProvider: React.FC<StacksProviderProps> = ({ children }) => {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Initialize network
  const network = APP_CONFIG.NETWORK === 'mainnet' 
    ? new StacksMainnet({ url: 'https://api.hiro.so' })
    : new StacksTestnet({ url: APP_CONFIG.STACKS_API_URL });

  // Initialize user session
  useEffect(() => {
    const session = new UserSession({ appConfig });
    setUserSession(session);

    // Check if user is already signed in
    if (session.isUserSignedIn()) {
      setIsConnected(true);
      const userData = session.loadUserData();
      setUserAddress(userData.profile.stxAddress[APP_CONFIG.NETWORK] || null);
    }
  }, []);

  // Connect wallet function
  const connect = () => {
    if (!userSession) return;

    // This will be handled by the Connect component
    // The actual connection logic is in the authOptions
  };

  // Disconnect wallet function
  const disconnect = () => {
    if (userSession) {
      userSession.signUserOut();
      setIsConnected(false);
      setUserAddress(null);
    }
  };

  // Auth options for Stacks Connect
  const authOptions = {
    appDetails: {
      name: 'HyperInsure',
      icon: '/logo.png', // Make sure to add your logo
    },
    redirectTo: '/',
    onFinish: () => {
      if (userSession && userSession.isUserSignedIn()) {
        setIsConnected(true);
        const userData = userSession.loadUserData();
        setUserAddress(userData.profile.stxAddress[APP_CONFIG.NETWORK] || null);
        
        if (APP_CONFIG.DEBUG_MODE) {
          console.log('User connected:', userData.profile.stxAddress);
        }
      }
    },
    userSession,
  };

  const contextValue: StacksContextType = {
    userSession,
    isConnected,
    userAddress,
    connect,
    disconnect,
    network,
  };

  return (
    <StacksContext.Provider value={contextValue}>
      <Connect authOptions={authOptions}>
        {children}
      </Connect>
    </StacksContext.Provider>
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

  if (isConnected && userAddress) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-600">
          {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      data-stacks-connect
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
    >
      {children}
    </button>
  );
};