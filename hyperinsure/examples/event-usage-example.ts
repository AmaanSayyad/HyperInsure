/**
 * Example usage of the Insurance Event Parser and Formatter
 * This demonstrates how to use the event parsing system in a frontend application
 */

import {
  parseInsuranceEvent,
  getEventMetadata,
  createEventQuery,
  MockEventStream,
  EventCategory,
  EventPriority,
  formatAmount,
  formatAddress,
  type InsuranceEvent
} from '../utils/event-parser';

// Example: Parsing raw events from the blockchain
console.log('=== Event Parsing Example ===');

const rawEvents = [
  {
    event: 'treasury-funded',
    funder: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    amount: '1000000000',
    'new-balance': '5000000000'
  },
  {
    event: 'policy-created',
    'policy-id': '1',
    holder: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
    'coverage-amount': '10000000000',
    'premium-paid': '100000000',
    duration: '144000',
    'treasury-funded': true
  },
  {
    event: 'claim-submitted',
    'claim-id': '1',
    'policy-id': '1',
    submitter: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
    'policy-coverage': '10000000000',
    'treasury-balance': '5000000000'
  },
  {
    event: 'claim-verified-and-paid',
    'claim-id': '1',
    'policy-id': '1',
    'tx-hash': '0x1234567890abcdef',
    'payout-amount': '10000000000',
    recipient: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
    'treasury-balance-after': '4000000000'
  }
];

// Parse raw events into structured format
const parsedEvents: InsuranceEvent[] = rawEvents
  .map(parseInsuranceEvent)
  .filter((event): event is InsuranceEvent => event !== null);

console.log(`Parsed ${parsedEvents.length} events:`);
parsedEvents.forEach((event, index) => {
  const metadata = getEventMetadata(event);
  console.log(`${index + 1}. ${metadata.title}: ${metadata.description}`);
});

// Example: Event filtering and querying
console.log('\n=== Event Filtering Example ===');

// Filter treasury events
const treasuryEvents = createEventQuery()
  .byCategory(EventCategory.TREASURY)
  .execute(parsedEvents);

console.log(`Treasury events: ${treasuryEvents.length}`);
treasuryEvents.forEach(event => {
  const metadata = getEventMetadata(event);
  console.log(`- ${metadata.title}: ${metadata.description}`);
});

// Filter high priority events
const highPriorityEvents = createEventQuery()
  .byPriority(EventPriority.HIGH)
  .execute(parsedEvents);

console.log(`\nHigh priority events: ${highPriorityEvents.length}`);
highPriorityEvents.forEach(event => {
  const metadata = getEventMetadata(event);
  console.log(`- ${metadata.title}: ${metadata.description}`);
});

// Filter events by policy ID
const policy1Events = createEventQuery()
  .byPolicyId(1)
  .execute(parsedEvents);

console.log(`\nEvents for Policy #1: ${policy1Events.length}`);
policy1Events.forEach(event => {
  const metadata = getEventMetadata(event);
  console.log(`- ${metadata.title}: ${metadata.description}`);
});

// Example: Real-time event streaming
console.log('\n=== Event Streaming Example ===');

const eventStream = new MockEventStream();

// Subscribe to events
const unsubscribe = eventStream.subscribe((event) => {
  const metadata = getEventMetadata(event);
  console.log(`🔔 New Event: ${metadata.title} - ${metadata.description}`);
});

// Simulate some events
console.log('Simulating real-time events...');

setTimeout(() => {
  eventStream.emitEvent({
    event: 'treasury-funded',
    funder: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
    amount: 2000000000,
    newBalance: 7000000000
  });
}, 1000);

setTimeout(() => {
  eventStream.emitEvent({
    event: 'policy-created',
    policyId: 2,
    holder: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC',
    coverageAmount: 5000000000,
    premiumPaid: 50000000,
    duration: 144000,
    treasuryFunded: true
  });
}, 2000);

setTimeout(() => {
  eventStream.emitEvent({
    event: 'error-occurred',
    operation: 'claim-verification',
    errorCode: 4,
    timestamp: Date.now()
  });
}, 3000);

// Clean up after 5 seconds
setTimeout(() => {
  unsubscribe();
  console.log('\n✅ Event streaming example completed');
  
  // Show recent events
  const recentEvents = eventStream.getRecentEvents(10);
  console.log(`\nRecent events (${recentEvents.length}):`);
  recentEvents.forEach((event, index) => {
    const metadata = getEventMetadata(event);
    console.log(`${index + 1}. ${metadata.title}: ${metadata.description}`);
  });
}, 5000);

// Example: Utility functions
console.log('\n=== Utility Functions Example ===');

const amounts = [1000000, 100000000, 1000000000, 10000000000];
console.log('Amount formatting:');
amounts.forEach(amount => {
  console.log(`${amount} micro-STX = ${formatAmount(amount)} STX`);
});

const addresses = [
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
  'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
];

console.log('\nAddress formatting:');
addresses.forEach(address => {
  console.log(`${address} -> ${formatAddress(address)}`);
});

// Example: Event metadata for UI components
console.log('\n=== Event Metadata for UI ===');

parsedEvents.forEach((event, index) => {
  const metadata = getEventMetadata(event);
  console.log(`Event ${index + 1}:`);
  console.log(`  Title: ${metadata.title}`);
  console.log(`  Description: ${metadata.description}`);
  console.log(`  Category: ${metadata.category}`);
  console.log(`  Priority: ${metadata.priority}`);
  console.log(`  Icon: ${metadata.icon}`);
  console.log(`  Color: ${metadata.color}`);
  console.log('');
});

export { parsedEvents, eventStream };