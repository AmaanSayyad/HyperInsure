import { describe, it, expect } from 'vitest';
import {
  parseInsuranceEvent,
  getEventMetadata,
  filterEventsByCategory,
  filterEventsByPriority,
  sortEventsByPriority,
  formatAmount,
  formatAddress,
  createEventQuery,
  MockEventStream,
  EventCategory,
  EventPriority,
  type InsuranceEvent,
  type TreasuryFundedEvent,
  type PolicyCreatedEvent,
  type ClaimSubmittedEvent
} from '../utils/event-parser';

describe('Event Parser', () => {
  describe('parseInsuranceEvent', () => {
    it('should parse treasury-funded event correctly', () => {
      const rawEvent = {
        event: 'treasury-funded',
        funder: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: '1000000000',
        'new-balance': '5000000000'
      };

      const parsed = parseInsuranceEvent(rawEvent) as TreasuryFundedEvent;
      
      expect(parsed).toBeDefined();
      expect(parsed.event).toBe('treasury-funded');
      expect(parsed.funder).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(parsed.amount).toBe(1000000000);
      expect(parsed.newBalance).toBe(5000000000);
    });

    it('should parse policy-created event correctly', () => {
      const rawEvent = {
        event: 'policy-created',
        'policy-id': '1',
        holder: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        'coverage-amount': '10000000000',
        'premium-paid': '100000000',
        duration: '144000',
        'treasury-funded': true
      };

      const parsed = parseInsuranceEvent(rawEvent) as PolicyCreatedEvent;
      
      expect(parsed).toBeDefined();
      expect(parsed.event).toBe('policy-created');
      expect(parsed.policyId).toBe(1);
      expect(parsed.holder).toBe('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5');
      expect(parsed.coverageAmount).toBe(10000000000);
      expect(parsed.premiumPaid).toBe(100000000);
      expect(parsed.duration).toBe(144000);
      expect(parsed.treasuryFunded).toBe(true);
    });

    it('should parse claim-submitted event correctly', () => {
      const rawEvent = {
        event: 'claim-submitted',
        'claim-id': '1',
        'policy-id': '1',
        submitter: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        'policy-coverage': '10000000000',
        'treasury-balance': '5000000000'
      };

      const parsed = parseInsuranceEvent(rawEvent) as ClaimSubmittedEvent;
      
      expect(parsed).toBeDefined();
      expect(parsed.event).toBe('claim-submitted');
      expect(parsed.claimId).toBe(1);
      expect(parsed.policyId).toBe(1);
      expect(parsed.submitter).toBe('ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5');
      expect(parsed.policyCoverage).toBe(10000000000);
      expect(parsed.treasuryBalance).toBe(5000000000);
    });

    it('should return null for invalid event', () => {
      const rawEvent = {
        invalidField: 'test'
      };

      const parsed = parseInsuranceEvent(rawEvent);
      expect(parsed).toBeNull();
    });

    it('should return null for unknown event type', () => {
      const rawEvent = {
        event: 'unknown-event-type',
        data: 'test'
      };

      const parsed = parseInsuranceEvent(rawEvent);
      expect(parsed).toBeNull();
    });
  });

  describe('getEventMetadata', () => {
    it('should return correct metadata for treasury-funded event', () => {
      const event: TreasuryFundedEvent = {
        event: 'treasury-funded',
        funder: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 1000000000,
        newBalance: 5000000000
      };

      const metadata = getEventMetadata(event);
      
      expect(metadata.category).toBe(EventCategory.TREASURY);
      expect(metadata.priority).toBe(EventPriority.MEDIUM);
      expect(metadata.title).toBe('Treasury Funded');
      expect(metadata.description).toContain('1,000.000000 STX');
      expect(metadata.icon).toBe('💰');
      expect(metadata.color).toBe('green');
    });

    it('should return correct metadata for policy-created event', () => {
      const event: PolicyCreatedEvent = {
        event: 'policy-created',
        policyId: 1,
        holder: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        coverageAmount: 10000000000,
        premiumPaid: 100000000,
        duration: 144000,
        treasuryFunded: true
      };

      const metadata = getEventMetadata(event);
      
      expect(metadata.category).toBe(EventCategory.POLICY);
      expect(metadata.priority).toBe(EventPriority.MEDIUM);
      expect(metadata.title).toBe('Policy Created');
      expect(metadata.description).toContain('policy #1');
      expect(metadata.description).toContain('10,000.000000 STX');
      expect(metadata.icon).toBe('📋');
      expect(metadata.color).toBe('blue');
    });
  });

  describe('Event filtering and sorting', () => {
    const sampleEvents: InsuranceEvent[] = [
      {
        event: 'treasury-funded',
        funder: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 1000000000,
        newBalance: 5000000000
      },
      {
        event: 'policy-created',
        policyId: 1,
        holder: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        coverageAmount: 10000000000,
        premiumPaid: 100000000,
        duration: 144000,
        treasuryFunded: true
      },
      {
        event: 'error-occurred',
        operation: 'test-operation',
        errorCode: 1,
        timestamp: 1234567890
      }
    ];

    it('should filter events by category', () => {
      const treasuryEvents = filterEventsByCategory(sampleEvents, EventCategory.TREASURY);
      expect(treasuryEvents).toHaveLength(1);
      expect(treasuryEvents[0].event).toBe('treasury-funded');

      const policyEvents = filterEventsByCategory(sampleEvents, EventCategory.POLICY);
      expect(policyEvents).toHaveLength(1);
      expect(policyEvents[0].event).toBe('policy-created');

      const errorEvents = filterEventsByCategory(sampleEvents, EventCategory.ERROR);
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].event).toBe('error-occurred');
    });

    it('should filter events by priority', () => {
      const mediumEvents = filterEventsByPriority(sampleEvents, EventPriority.MEDIUM);
      expect(mediumEvents).toHaveLength(2);

      const criticalEvents = filterEventsByPriority(sampleEvents, EventPriority.CRITICAL);
      expect(criticalEvents).toHaveLength(1);
      expect(criticalEvents[0].event).toBe('error-occurred');
    });

    it('should sort events by priority', () => {
      const sorted = sortEventsByPriority(sampleEvents);
      expect(sorted[0].event).toBe('error-occurred'); // Critical priority first
      expect(sorted[1].event).toBe('treasury-funded'); // Medium priority
      expect(sorted[2].event).toBe('policy-created'); // Medium priority
    });
  });

  describe('Utility functions', () => {
    it('should format amounts correctly', () => {
      expect(formatAmount(1000000)).toBe('1.000000');
      expect(formatAmount(1500000)).toBe('1.500000');
      expect(formatAmount(1000000000)).toBe('1,000.000000');
    });

    it('should format addresses correctly', () => {
      const longAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
      expect(formatAddress(longAddress)).toBe('ST1PQH...GZGM');
      
      const shortAddress = 'ST1PQH';
      expect(formatAddress(shortAddress)).toBe('ST1PQH');
    });
  });

  describe('EventQueryBuilder', () => {
    const sampleEvents: InsuranceEvent[] = [
      {
        event: 'treasury-funded',
        funder: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 1000000000,
        newBalance: 5000000000
      },
      {
        event: 'policy-created',
        policyId: 1,
        holder: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        coverageAmount: 10000000000,
        premiumPaid: 100000000,
        duration: 144000,
        treasuryFunded: true
      },
      {
        event: 'claim-submitted',
        claimId: 1,
        policyId: 1,
        submitter: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        policyCoverage: 10000000000,
        treasuryBalance: 5000000000
      }
    ];

    it('should filter by category', () => {
      const result = createEventQuery()
        .byCategory(EventCategory.TREASURY)
        .execute(sampleEvents);
      
      expect(result).toHaveLength(1);
      expect(result[0].event).toBe('treasury-funded');
    });

    it('should filter by event type', () => {
      const result = createEventQuery()
        .byEventType('policy-created')
        .execute(sampleEvents);
      
      expect(result).toHaveLength(1);
      expect(result[0].event).toBe('policy-created');
    });

    it('should filter by policy ID', () => {
      const result = createEventQuery()
        .byPolicyId(1)
        .execute(sampleEvents);
      
      expect(result).toHaveLength(2);
      expect(result.every(e => 'policyId' in e && e.policyId === 1)).toBe(true);
    });

    it('should chain multiple filters', () => {
      const result = createEventQuery()
        .byCategory(EventCategory.CLAIM)
        .byPolicyId(1)
        .execute(sampleEvents);
      
      expect(result).toHaveLength(1);
      expect(result[0].event).toBe('claim-submitted');
    });
  });

  describe('MockEventStream', () => {
    it('should handle subscriptions correctly', () => {
      const stream = new MockEventStream();
      const receivedEvents: InsuranceEvent[] = [];
      
      const unsubscribe = stream.subscribe((event) => {
        receivedEvents.push(event);
      });

      const testEvent: TreasuryFundedEvent = {
        event: 'treasury-funded',
        funder: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 1000000000,
        newBalance: 5000000000
      };

      stream.emitEvent(testEvent);
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toEqual(testEvent);

      unsubscribe();
      stream.emitEvent(testEvent);
      expect(receivedEvents).toHaveLength(1); // Should not receive after unsubscribe
    });

    it('should return recent events', () => {
      const stream = new MockEventStream();
      
      const event1: TreasuryFundedEvent = {
        event: 'treasury-funded',
        funder: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        amount: 1000000000,
        newBalance: 5000000000
      };

      const event2: PolicyCreatedEvent = {
        event: 'policy-created',
        policyId: 1,
        holder: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        coverageAmount: 10000000000,
        premiumPaid: 100000000,
        duration: 144000,
        treasuryFunded: true
      };

      stream.emitEvent(event1);
      stream.emitEvent(event2);

      const recent = stream.getRecentEvents(10);
      expect(recent).toHaveLength(2);
      expect(recent[0]).toEqual(event1);
      expect(recent[1]).toEqual(event2);
    });
  });
});