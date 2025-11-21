;; Frontend API Contract - Provides unified read-only query functions for frontend applications

(define-constant ERR_POLICY_NOT_FOUND (err u11))
(define-constant ERR_CLAIM_NOT_FOUND (err u21))

;; Get comprehensive policy details with status information
(define-read-only (get-policy-details (policy-id uint))
  (match (contract-call? .policy-manager get-policy policy-id)
    policy 
    (let (
      (is-active (contract-call? .policy-manager is-policy-active policy-id))
      (is-expired (contract-call? .policy-manager is-policy-expired policy-id))
      (has-claim (contract-call? .claim-processor has-policy-claim policy-id))
    )
      (ok {
        policy-id: policy-id,
        holder: (get holder policy),
        coverage-amount: (get coverage-amount policy),
        premium-paid: (get premium-paid policy),
        start-block: (get start-block policy),
        end-block: (get end-block policy),
        status: (get status policy),
        is-active: is-active,
        is-expired: is-expired,
        has-claim: has-claim,
        blocks-remaining: (if is-expired u0 (- (get end-block policy) stacks-block-height))
      })
    )
    ERR_POLICY_NOT_FOUND
  )
)

;; Get policy status summary
(define-read-only (get-policy-status (policy-id uint))
  (match (contract-call? .policy-manager get-policy policy-id)
    policy
    (ok {
      policy-id: policy-id,
      status: (get status policy),
      is-active: (contract-call? .policy-manager is-policy-active policy-id),
      is-expired: (contract-call? .policy-manager is-policy-expired policy-id),
      end-block: (get end-block policy),
      blocks-remaining: (if (contract-call? .policy-manager is-policy-expired policy-id) 
                         u0 
                         (- (get end-block policy) stacks-block-height))
    })
    ERR_POLICY_NOT_FOUND
  )
)

;; Get comprehensive claim details
(define-read-only (get-claim-details (claim-id uint))
  (match (contract-call? .claim-processor get-claim claim-id)
    claim
    (let (
      (policy-details (contract-call? .policy-manager get-policy (get policy-id claim)))
    )
      (ok {
        claim-id: claim-id,
        policy-id: (get policy-id claim),
        submitter: (get submitter claim),
        status: (get status claim),
        payout-amount: (get payout-amount claim),
        verified-tx-hash: (get verified-tx-hash claim),
        policy-coverage: (match policy-details 
                          policy (some (get coverage-amount policy))
                          none),
        submission-block: stacks-block-height
      })
    )
    ERR_CLAIM_NOT_FOUND
  )
)

;; Get claim status and payout information
(define-read-only (get-claim-status (claim-id uint))
  (match (contract-call? .claim-processor get-claim claim-id)
    claim
    (ok {
      claim-id: claim-id,
      policy-id: (get policy-id claim),
      status: (get status claim),
      payout-amount: (get payout-amount claim),
      is-pending: (is-eq (get status claim) "pending"),
      is-verified: (is-eq (get status claim) "verified"),
      is-paid: (is-eq (get status claim) "paid"),
      is-rejected: (is-eq (get status claim) "rejected")
    })
    ERR_CLAIM_NOT_FOUND
  )
)

;; Get comprehensive treasury statistics
(define-read-only (get-treasury-statistics)
  (ok {
    total-balance: (contract-call? .insurance-treasury-v2 get-treasury-balance),
    total-funded: (contract-call? .insurance-treasury-v2 get-total-funded),
    total-paid-out: (contract-call? .insurance-treasury-v2 get-total-paid-out),
    available-balance: (contract-call? .insurance-treasury-v2 get-available-balance),
    available-for-payout: (contract-call? .insurance-treasury-v2 get-available-for-payout),
    reserve-amount: (contract-call? .insurance-treasury-v2 get-reserve-amount),
    current-block: stacks-block-height
  })
)

;; Get treasury health metrics
(define-read-only (get-treasury-health)
  (let (
    (total-balance (contract-call? .insurance-treasury-v2 get-treasury-balance))
    (total-paid-out (contract-call? .insurance-treasury-v2 get-total-paid-out))
    (available-for-payout (contract-call? .insurance-treasury-v2 get-available-for-payout))
    (reserve-amount (contract-call? .insurance-treasury-v2 get-reserve-amount))
  )
    (ok {
      total-balance: total-balance,
      available-for-payout: available-for-payout,
      reserve-amount: reserve-amount,
      utilization-rate: (if (> total-balance u0) 
                         (/ (* total-paid-out u100) total-balance) 
                         u0),
      reserve-ratio: (if (> total-balance u0) 
                      (/ (* reserve-amount u100) total-balance) 
                      u0),
      is-healthy: (> available-for-payout u0),
      can-pay-claims: (> available-for-payout u1000000)
    })
  )
)

;; Get system-wide statistics
(define-read-only (get-system-overview)
  (let (
    (total-policies (contract-call? .policy-manager get-policy-counter))
    (total-claims (contract-call? .claim-processor get-claim-counter))
    (treasury-stats (contract-call? .insurance-treasury-v2 get-treasury-balance))
  )
    (ok {
      total-policies: total-policies,
      total-claims: total-claims,
      treasury-balance: treasury-stats,
      current-block: stacks-block-height,
      system-status: "operational"
    })
  )
)

;; Get recent payout records by checking recent claims
(define-read-only (get-recent-payouts (limit uint))
  (let (
    (max-claim-id (contract-call? .claim-processor get-claim-counter))
    (start-id (if (> max-claim-id limit) (- max-claim-id limit) u1))
  )
    (ok {
      total-claims: max-claim-id,
      start-id: start-id,
      end-id: max-claim-id,
      payout-1: (get-claim-if-paid start-id),
      payout-2: (get-claim-if-paid (+ start-id u1)),
      payout-3: (get-claim-if-paid (+ start-id u2)),
      payout-4: (get-claim-if-paid (+ start-id u3)),
      payout-5: (get-claim-if-paid (+ start-id u4))
    })
  )
)

;; Helper function to get claim if it's paid
(define-private (get-claim-if-paid (claim-id uint))
  (match (contract-call? .claim-processor get-claim claim-id)
    claim
    (if (is-eq (get status claim) "paid")
      (some {
        claim-id: claim-id,
        policy-id: (get policy-id claim),
        recipient: (get submitter claim),
        payout-amount: (get payout-amount claim),
        verified-tx-hash: (get verified-tx-hash claim)
      })
      none
    )
    none
  )
)
