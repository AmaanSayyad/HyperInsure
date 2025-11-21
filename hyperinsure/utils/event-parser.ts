/**
 * Event Parser and Formatter for Insurance System
 * Provides structured event definitions and parsing utilities for frontend consumption
 */

// Event type definitions based on the smart contract events
export interface TreasuryFundedEvent {
  event: 'treasury-funded';
  funder: string;
  amount: number;
  newBalance: number;
}

export interface PremiumReceivedEvent {
  event: 'premium-received';
  policyId: number;
  amount: number;
  from: string;
  newBalance: number;
  caller: string;
}

export interface ClaimPayoutEvent {
  event: 'claim-payout';
  claimId: number;
  recipient: string;
  amount: number;
  remainingBalance: number;
  caller: string;
}

export interface AtomicPayoutSuccessEvent {
  event: 'atomic-payout-success';
  claimId: number;
  recipient: string;
  amount: number;
  remainingBalance: number;
  reserveAmount: number;
  availableForPayout: number;
}

export interface PolicyCreatedEvent {
  event: 'policy-created';
  policyId: number;
  holder: string;
  coverageAmount: number;
  premiumPaid: number;
  duration: number;
  treasuryFunded: boolean;
}

export interface ClaimSubmittedEvent {
  event: 'claim-submitted';
  claimId: number;
  policyId: number;
  submitter: string;
  policyCoverage: number;
  treasuryBalance: number;
}

export interface ClaimVerifiedAndPaidEvent {
  event: 'claim-verified-and-paid';
  claimId: number;
  policyId: number;
  txHash: string;
  payoutAmount: number;
  recipient: string;
  treasuryBalanceAfter: number;
}

export interface ClaimRejectedEvent {
  event: 'claim-rejected';
  claimId: number;
  reason: string;
  errorCode?: number;
}

export interface ErrorOccurredEvent {
  event: 'error-occurred';
  operation: string;
  errorCode: number;
  timestamp: number;
}

// Union type for all possible events
export type InsuranceEvent = 
  | TreasuryFundedEvent
  | PremiumReceivedEvent
  | ClaimPayoutEvent
  | AtomicPayoutSuccessEvent
  | PolicyCreatedEvent
  | ClaimSubmittedEvent
  | ClaimVerifiedAndPaidEvent
  | ClaimRejectedEvent
  | ErrorOccurredEvent;

// Event categories for filtering
export enum EventCategory {
  TREASURY = 'treasury',
  POLICY = 'policy',
  CLAIM = 'claim',
  ERROR = 'error'
}

// Event priority levels for UI display
export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Event metadata for enhanced display
export interface EventMetadata {
  category: EventCategory;
  priority: EventPriority;
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

/**
 * Parse raw event data from Stacks blockchain into structured format
 */
export function parseInsuranceEvent(rawEvent: any): InsuranceEvent | null {
  try {
    if (!rawEvent || !rawEvent.event) {
      return null;
    }

    const eventType = rawEvent.event;
    
    switch (eventType) {
      case 'treasury-funded':
        return {
          event: 'treasury-funded',
          funder: rawEvent.funder,
          amount: parseInt(rawEvent.amount),
          newBalance: parseInt(rawEvent['new-balance'] || rawEvent.newBalance)
        };

      case 'premium-received':
        return {
          event: 'premium-received',
          policyId: parseInt(rawEvent['policy-id'] || rawEvent.policyId),
          amount: parseInt(rawEvent.amount),
          from: rawEvent.from,
          newBalance: parseInt(rawEvent['new-balance'] || rawEvent.newBalance),
          caller: rawEvent.caller
        };

      case 'claim-payout':
        return {
          event: 'claim-payout',
          claimId: parseInt(rawEvent['claim-id'] || rawEvent.claimId),
          recipient: rawEvent.recipient,
          amount: parseInt(rawEvent.amount),
          remainingBalance: parseInt(rawEvent['remaining-balance'] || rawEvent.remainingBalance),
          caller: rawEvent.caller
        };

      case 'atomic-payout-success':
        return {
          event: 'atomic-payout-success',
          claimId: parseInt(rawEvent['claim-id'] || rawEvent.claimId),
          recipient: rawEvent.recipient,
          amount: parseInt(rawEvent.amount),
          remainingBalance: parseInt(rawEvent['remaining-balance'] || rawEvent.remainingBalance),
          reserveAmount: parseInt(rawEvent['reserve-amount'] || rawEvent.reserveAmount),
          availableForPayout: parseInt(rawEvent['available-for-payout'] || rawEvent.availableForPayout)
        };

      case 'policy-created':
        return {
          event: 'policy-created',
          policyId: parseInt(rawEvent['policy-id'] || rawEvent.policyId),
          holder: rawEvent.holder,
          coverageAmount: parseInt(rawEvent['coverage-amount'] || rawEvent.coverageAmount),
          premiumPaid: parseInt(rawEvent['premium-paid'] || rawEvent.premiumPaid),
          duration: parseInt(rawEvent.duration),
          treasuryFunded: rawEvent['treasury-funded'] || rawEvent.treasuryFunded
        };

      case 'claim-submitted':
        return {
          event: 'claim-submitted',
          claimId: parseInt(rawEvent['claim-id'] || rawEvent.claimId),
          policyId: parseInt(rawEvent['policy-id'] || rawEvent.policyId),
          submitter: rawEvent.submitter,
          policyCoverage: parseInt(rawEvent['policy-coverage'] || rawEvent.policyCoverage),
          treasuryBalance: parseInt(rawEvent['treasury-balance'] || rawEvent.treasuryBalance)
        };

      case 'claim-verified-and-paid':
        return {
          event: 'claim-verified-and-paid',
          claimId: parseInt(rawEvent['claim-id'] || rawEvent.claimId),
          policyId: parseInt(rawEvent['policy-id'] || rawEvent.policyId),
          txHash: rawEvent['tx-hash'] || rawEvent.txHash,
          payoutAmount: parseInt(rawEvent['payout-amount'] || rawEvent.payoutAmount),
          recipient: rawEvent.recipient,
          treasuryBalanceAfter: parseInt(rawEvent['treasury-balance-after'] || rawEvent.treasuryBalanceAfter)
        };

      case 'claim-rejected':
        return {
          event: 'claim-rejected',
          claimId: parseInt(rawEvent['claim-id'] || rawEvent.claimId),
          reason: rawEvent.reason,
          errorCode: rawEvent['error-code'] ? parseInt(rawEvent['error-code']) : undefined
        };

      case 'error-occurred':
        return {
          event: 'error-occurred',
          operation: rawEvent.operation,
          errorCode: parseInt(rawEvent['error-code'] || rawEvent.errorCode),
          timestamp: parseInt(rawEvent.timestamp)
        };

      default:
        console.warn(`Unknown event type: ${eventType}`);
        return null;
    }
  } catch (error) {
    console.error('Error parsing insurance event:', error);
    return null;
  }
}

/**
 * Get metadata for an event to enhance UI display
 */
export function getEventMetadata(event: InsuranceEvent): EventMetadata {
  switch (event.event) {
    case 'treasury-funded':
      return {
        category: EventCategory.TREASURY,
        priority: EventPriority.MEDIUM,
        title: 'Treasury Funded',
        description: `Treasury received ${formatAmount(event.amount)} STX`,
        icon: '💰',
        color: 'green'
      };

    case 'premium-received':
      return {
        category: EventCategory.TREASURY,
        priority: EventPriority.LOW,
        title: 'Premium Received',
        description: `Premium of ${formatAmount(event.amount)} STX received for policy #${event.policyId}`,
        icon: '💳',
        color: 'blue'
      };

    case 'claim-payout':
    case 'atomic-payout-success':
      return {
        category: EventCategory.CLAIM,
        priority: EventPriority.HIGH,
        title: 'Claim Paid',
        description: `Payout of ${formatAmount(event.amount)} STX sent to ${formatAddress(event.recipient)}`,
        icon: '✅',
        color: 'green'
      };

    case 'policy-created':
      return {
        category: EventCategory.POLICY,
        priority: EventPriority.MEDIUM,
        title: 'Policy Created',
        description: `New policy #${event.policyId} created with ${formatAmount(event.coverageAmount)} STX coverage`,
        icon: '📋',
        color: 'blue'
      };

    case 'claim-submitted':
      return {
        category: EventCategory.CLAIM,
        priority: EventPriority.MEDIUM,
        title: 'Claim Submitted',
        description: `Claim #${event.claimId} submitted for policy #${event.policyId}`,
        icon: '📝',
        color: 'orange'
      };

    case 'claim-verified-and-paid':
      return {
        category: EventCategory.CLAIM,
        priority: EventPriority.HIGH,
        title: 'Claim Verified & Paid',
        description: `Claim #${event.claimId} verified and ${formatAmount(event.payoutAmount)} STX paid`,
        icon: '🎉',
        color: 'green'
      };

    case 'claim-rejected':
      return {
        category: EventCategory.CLAIM,
        priority: EventPriority.HIGH,
        title: 'Claim Rejected',
        description: `Claim #${event.claimId} rejected: ${event.reason}`,
        icon: '❌',
        color: 'red'
      };

    case 'error-occurred':
      return {
        category: EventCategory.ERROR,
        priority: EventPriority.CRITICAL,
        title: 'System Error',
        description: `Error in ${event.operation}: Code ${event.errorCode}`,
        icon: '⚠️',
        color: 'red'
      };

    default:
      return {
        category: EventCategory.ERROR,
        priority: EventPriority.LOW,
        title: 'Unknown Event',
        description: 'Unknown event type',
        icon: '❓',
        color: 'gray'
      };
  }
}

/**
 * Filter events by category
 */
export function filterEventsByCategory(events: InsuranceEvent[], category: EventCategory): InsuranceEvent[] {
  return events.filter(event => getEventMetadata(event).category === category);
}

/**
 * Filter events by priority
 */
export function filterEventsByPriority(events: InsuranceEvent[], priority: EventPriority): InsuranceEvent[] {
  return events.filter(event => getEventMetadata(event).priority === priority);
}

/**
 * Sort events by priority (critical first)
 */
export function sortEventsByPriority(events: InsuranceEvent[]): InsuranceEvent[] {
  const priorityOrder = {
    [EventPriority.CRITICAL]: 0,
    [EventPriority.HIGH]: 1,
    [EventPriority.MEDIUM]: 2,
    [EventPriority.LOW]: 3
  };

  return events.sort((a, b) => {
    const aPriority = getEventMetadata(a).priority;
    const bPriority = getEventMetadata(b).priority;
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });
}

/**
 * Format STX amount for display (convert from micro-STX to STX)
 */
export function formatAmount(microStx: number): string {
  const stx = microStx / 1000000;
  return stx.toLocaleString('en-US', { 
    minimumFractionDigits: 6, 
    maximumFractionDigits: 6 
  });
}

/**
 * Format Stacks address for display (truncate middle)
 */
export function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Create a real-time event stream interface
 */
export interface EventStream {
  subscribe(callback: (event: InsuranceEvent) => void): () => void;
  getRecentEvents(limit?: number): InsuranceEvent[];
  filterEvents(filter: (event: InsuranceEvent) => boolean): InsuranceEvent[];
}

/**
 * Mock event stream implementation for development
 */
export class MockEventStream implements EventStream {
  private events: InsuranceEvent[] = [];
  private subscribers: ((event: InsuranceEvent) => void)[] = [];

  subscribe(callback: (event: InsuranceEvent) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  getRecentEvents(limit: number = 50): InsuranceEvent[] {
    return this.events.slice(-limit);
  }

  filterEvents(filter: (event: InsuranceEvent) => boolean): InsuranceEvent[] {
    return this.events.filter(filter);
  }

  // Method to simulate new events (for testing)
  emitEvent(event: InsuranceEvent): void {
    this.events.push(event);
    this.subscribers.forEach(callback => callback(event));
  }
}

/**
 * Event query builder for complex filtering
 */
export class EventQueryBuilder {
  private filters: ((event: InsuranceEvent) => boolean)[] = [];

  byCategory(category: EventCategory): EventQueryBuilder {
    this.filters.push(event => getEventMetadata(event).category === category);
    return this;
  }

  byPriority(priority: EventPriority): EventQueryBuilder {
    this.filters.push(event => getEventMetadata(event).priority === priority);
    return this;
  }

  byEventType(eventType: string): EventQueryBuilder {
    this.filters.push(event => event.event === eventType);
    return this;
  }

  byPolicyId(policyId: number): EventQueryBuilder {
    this.filters.push(event => {
      return 'policyId' in event && event.policyId === policyId;
    });
    return this;
  }

  byClaimId(claimId: number): EventQueryBuilder {
    this.filters.push(event => {
      return 'claimId' in event && event.claimId === claimId;
    });
    return this;
  }

  execute(events: InsuranceEvent[]): InsuranceEvent[] {
    return events.filter(event => 
      this.filters.every(filter => filter(event))
    );
  }
}

/**
 * Create a new event query builder
 */
export function createEventQuery(): EventQueryBuilder {
  return new EventQueryBuilder();
}