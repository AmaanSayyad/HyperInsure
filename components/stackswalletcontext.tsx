"use client"
import { Button } from './ui/button';
import { useStacksWallet } from './stackswalletconnect';
import { Wallet, LogOut } from 'lucide-react';

interface StacksWalletConnectProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showAddress?: boolean;
}

export const StacksWalletConnect = ({ 
  variant = 'default', 
  size = 'default', 
  className,
  showAddress = false 
}: StacksWalletConnectProps) => {
  const { isWalletConnected, connectWallet, disconnectWallet, selectedAddress } = useStacksWallet();

  const formatAddress = (addr: string | null) => {
    if (!addr || typeof addr !== 'string') return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isWalletConnected) {
    return (
      <div className="flex items-center gap-2">
        {showAddress && selectedAddress && (
          <span className="text-sm text-gray-600">
            {formatAddress(selectedAddress)}
          </span>
        )}
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={disconnectWallet}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={connectWallet}
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Stacks Wallet
    </Button>
  );
};

export default StacksWalletConnect;