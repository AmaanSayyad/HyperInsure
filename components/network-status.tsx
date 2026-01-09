'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Network, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Box,
  Globe,
  Link2,
  Copy,
  Check
} from 'lucide-react';
import { APP_CONFIG, CONTRACT_ADDRESSES, validateConfig, DEPLOYER_ADDRESS } from '@/lib/stacks-config';
import { ConnectWalletButton } from '@/lib/stacks-provider';

const CONTRACT_LABELS: Record<string, string> = {
  'CLARITY_BITCOIN': 'Clarity Bitcoin',
  'INSURANCE_TREASURY': 'Insurance Treasury',
  'POLICY_MANAGER': 'Policy Manager',
  'CLAIM_PROCESSOR': 'Claim Processor',
  'HYPERINSURE_CORE_V2': 'HyperInsure Core V2',
  'FRONTEND_API': 'Frontend API',
  'GOVERNANCE': 'Governance',
  'ORACLE': 'Oracle',
  'HYPERINSURE_CORE': 'HyperInsure Core',
};

export const NetworkStatus: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<{
    isValid: boolean;
    missingContracts: string[];
    hasDeployerAddress: boolean;
  } | null>(null);

  useEffect(() => {
    setConfigStatus(validateConfig());
  }, []);

  const contractEntries = Object.entries(CONTRACT_ADDRESSES).filter(([_, address]) => address);
  const deployerAddress = DEPLOYER_ADDRESS;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(id);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="relative">
      {/* Compact Header Bar */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Network info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-foreground">Network:</span>
                <Badge className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  {APP_CONFIG.NETWORK.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span className="text-sm text-foreground font-medium">
                  All contracts deployed
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full"
              >
                <Box className="w-4 h-4 mr-2" />
                {contractEntries.length} contracts
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {deployerAddress && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                  <span className="text-xs text-muted-foreground">Deployer:</span>
                  <button
                    onClick={() => copyToClipboard(deployerAddress, 'deployer')}
                    className="text-xs font-mono text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {formatAddress(deployerAddress)}
                    {copiedAddress === 'deployer' ? (
                      <Check className="w-3 h-3 text-secondary" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                asChild
                className="glass rounded-full text-sm border-white/10 hover:bg-white/5"
              >
                <a
                  href={APP_CONFIG.EXPLORER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  Explorer
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>

              <ConnectWalletButton className="text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Contract Panel */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 z-50 glass border-b border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Contract Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {contractEntries.map(([name, address]) => {
                const contractName = address.split('.')[1];
                const displayName = CONTRACT_LABELS[name] || name.replace(/_/g, ' ');
                
                return (
                  <div
                    key={name}
                    className="group relative glass rounded-xl p-4 hover:bg-white/5 transition-all border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Box className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {displayName}
                            </div>
                            <div className="text-xs text-foreground/60 font-mono truncate">
                              {contractName}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(address, name)}
                          className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === name ? (
                            <Check className="w-3.5 h-3.5 text-secondary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        
                        <a
                          href={`https://explorer.hiro.so/txid/${address}?chain=testnet&tab=overview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                          title="View in explorer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* API Endpoints */}
            <div className="grid md:grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground font-medium mb-0.5">Stacks API</div>
                  <div className="text-xs font-mono text-foreground/80 truncate">
                    {APP_CONFIG.STACKS_API_URL}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(APP_CONFIG.STACKS_API_URL, 'stacks-api')}
                  className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {copiedAddress === 'stacks-api' ? (
                    <Check className="w-3.5 h-3.5 text-secondary" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground font-medium mb-0.5">Bitcoin API</div>
                  <div className="text-xs font-mono text-foreground/80 truncate">
                    {APP_CONFIG.BITCOIN_API_URL}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(APP_CONFIG.BITCOIN_API_URL, 'bitcoin-api')}
                  className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {copiedAddress === 'bitcoin-api' ? (
                    <Check className="w-3.5 h-3.5 text-secondary" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
