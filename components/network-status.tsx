'use client';

/**
 * Network Status Component for HyperInsure
 * 
 * Displays current network information and contract deployment status
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Network, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Wallet
} from 'lucide-react';
import { APP_CONFIG, CONTRACT_ADDRESSES, validateConfig } from '@/lib/stacks-config';
import { ConnectWalletButton } from '@/lib/stacks-provider';

export const NetworkStatus: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [configStatus, setConfigStatus] = useState<{
    isValid: boolean;
    missingContracts: string[];
    hasDeployerAddress: boolean;
  } | null>(null);

  useEffect(() => {
    setConfigStatus(validateConfig());
  }, []);

  const getNetworkBadgeColor = () => {
    switch (APP_CONFIG.NETWORK) {
      case 'mainnet':
        return 'bg-green-500 hover:bg-green-600';
      case 'testnet':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = () => {
    if (!configStatus) return <AlertCircle className="w-4 h-4" />;
    return configStatus.isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-yellow-500" />
    );
  };

  const contractEntries = Object.entries(CONTRACT_ADDRESSES).filter(([_, address]) => address);

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1320px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Network info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span className="text-sm font-medium">Network:</span>
              <Badge className={`${getNetworkBadgeColor()} text-white`}>
                {APP_CONFIG.NETWORK.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm text-slate-600">
                {configStatus?.isValid ? 'All contracts deployed' : 'Configuration incomplete'}
              </span>
            </div>

            {contractEntries.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-600 hover:text-slate-900"
              >
                {contractEntries.length} contracts
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
            )}
          </div>

          {/* Right side - Wallet connection */}
          <div className="flex items-center gap-4">
            <ConnectWalletButton className="text-sm" />
            
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-sm"
            >
              <a
                href={APP_CONFIG.EXPLORER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </div>

        {/* Expanded contract details */}
        {isExpanded && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractEntries.map(([name, address]) => (
                  <div key={name} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div>
                      <div className="text-sm font-medium">{name.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {address.split('.')[1]}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-6 w-6 p-0"
                    >
                      <a
                        href={`${APP_CONFIG.EXPLORER_URL}&id=${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>

              {configStatus && !configStatus.isValid && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-sm text-yellow-800">
                    <strong>Configuration Issues:</strong>
                    {configStatus.missingContracts.length > 0 && (
                      <div className="mt-1">
                        Missing contracts: {configStatus.missingContracts.join(', ')}
                      </div>
                    )}
                    {!configStatus.hasDeployerAddress && (
                      <div className="mt-1">
                        Missing deployer address
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div>
                  API: {APP_CONFIG.STACKS_API_URL}
                </div>
                <div>
                  Bitcoin: {APP_CONFIG.BITCOIN_API_URL}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};