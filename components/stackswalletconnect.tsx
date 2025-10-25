"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';

interface StacksWalletContextType {
  isWalletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  addresses: string[];
  selectedAddress: string | null;
}

const StacksWalletContext = createContext<StacksWalletContextType | undefined>(undefined);

interface StacksWalletProviderProps {
  children: ReactNode;
}

export const StacksWalletProvider = ({ children }: StacksWalletProviderProps) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if already connected on app load
    const checkConnection = () => {
      const connected = isConnected();
      console.log('🔍 Checking initial connection status:', connected);
      setIsWalletConnected(connected);
      
      if (connected) {
        // Get stored wallet data from localStorage
        try {
          const storage = getLocalStorage();
          console.log('📝 Retrieved storage:', storage);
          
          if (storage && storage.addresses && Array.isArray(storage.addresses)) {
            const addressStrings = storage.addresses.map(addr => 
              typeof addr === 'string' ? addr : addr.address
            );
            setAddresses(addressStrings);
            setSelectedAddress(addressStrings[0]);
            console.log('✅ Restored addresses from storage:', addressStrings);
          }
        } catch (error) {
          console.error('❌ Error reading wallet storage:', error);
        }
      }
    };
    
    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      console.log('🔗 Initiating wallet connection...');
      
      const response = await connect();
      console.log('📝 Full connection response structure:', JSON.stringify(response, null, 2));
      console.log('📝 Response type:', typeof response);
      console.log('📝 Response keys:', response ? Object.keys(response) : 'no keys');
      
      if (response) {
        setIsWalletConnected(true);
        console.log('✅ Set wallet connected to true');
        
        // Handle official Stacks Connect response structure
        if (response.addresses && Array.isArray(response.addresses) && response.addresses.length > 0) {
          // Extract addresses from objects: { address: "SP...", publicKey: "..." }
          const addressStrings = response.addresses.map(addr => 
            typeof addr === 'string' ? addr : addr.address
          );
          setAddresses(addressStrings);
          setSelectedAddress(addressStrings[0]);
          console.log('✅ Set addresses:', addressStrings);
          console.log('✅ Set selected address:', addressStrings[0]);
        } else {
          // Fallback: check localStorage for stored wallet data
          try {
            const storage = getLocalStorage();
            if (storage && storage.addresses && Array.isArray(storage.addresses)) {
              const addressStrings = storage.addresses.map(addr => 
                typeof addr === 'string' ? addr : addr.address
              );
              setAddresses(addressStrings);
              setSelectedAddress(addressStrings[0]);
              console.log('✅ Used stored addresses:', addressStrings);
            } else {
              console.log('⚠️ No addresses found in response or storage');
            }
          } catch (storageError) {
            console.error('❌ Error reading storage:', storageError);
          }
        }
      } else {
        console.log('⚠️ No response from connect()');
        setIsWalletConnected(true); // Still set connected if no error
      }
      
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      setIsWalletConnected(false);
    }
  };

  const disconnectWallet = () => {
    try {
      console.log('🔌 Disconnecting wallet...');
      disconnect(); // Call the disconnect function from @stacks/connect
      setIsWalletConnected(false);
      setAddresses([]);
      setSelectedAddress(null);
      console.log('✅ Wallet disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
    }
  };

  const value: StacksWalletContextType = {
    isWalletConnected,
    connectWallet,
    disconnectWallet,
    addresses,
    selectedAddress,
  };

  return (
    <StacksWalletContext.Provider value={value}>
      {children}
    </StacksWalletContext.Provider>
  );
};

export const useStacksWallet = () => {
  const context = useContext(StacksWalletContext);
  if (context === undefined) {
    throw new Error('useStacksWallet must be used within a StacksWalletProvider');
  }
  return context;
};