;; Claim Processor Contract
;; Handles claim submissions and Bitcoin verification
;; This contract is part of the insurance claim verification system

;; Error codes - using centralized error codes
(define-constant ERR_POLICY_NOT_FOUND (err u11))
(define-constant ERR_POLICY_EXPIRED (err u12))
(define-constant ERR_UNAUTHORIZED (err u6))
(define-constant ERR_INVALID_PROOF (err u4))
(define-constant ERR_DUPLICATE_CLAIM (err u5))
(define-constant ERR_CLAIM_NOT_FOUND (err u21))
(define-constant ERR_INSUFFICIENT_FUNDS (err u1))
(define-constant ERR_NOT_POLICY_HOLDER (err u42))
(define-constant ERR_VERIFICATION_FAILED (err u32))
(define-constant ERR_INVALID_TX_HEX (err u33))
(define-constant ERR_INVALID_BLOCK_HEADER (err u34))
(define-constant ERR_INVALID_MERKLE_PROOF (err u35))
(define-constant ERR_INVALID_CLAIM_STATUS (err u23))

;; Data variables
(define-data-var claim-counter uint u0)
(define-data-var contract-owner principal tx-sender)

;; Claim data structure
(define-map claims uint {
  policy-id: uint,
  submitter: principal,
  tx-hex: (buff 1024),
  block-header: (buff 80),
  merkle-proof: {
    tx-index: uint,
    hashes: (list 12 (buff 32)),
    tree-depth: uint
  },
  status: (string-ascii 20),
  payout-amount: uint,
  verified-tx-hash: (optional (buff 32))
})

;; Map to prevent duplicate claims per policy
(define-map policy-claims uint uint)

;; Validation functions
(define-private (validate-claim-evidence (tx-hex (buff 1024)) (block-header (buff 80)) (merkle-proof {tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint}))
  (and
    (and (> (len tx-hex) u59) (<= (len tx-hex) u1024))
    (is-eq (len block-header) u80)
    (and (> (get tree-depth merkle-proof) u0) (<= (get tree-depth merkle-proof) u32))
    (> (len (get hashes merkle-proof)) u0)
  )
)

(define-private (log-error (operation (string-ascii 50)) (error-code uint))
  (print {
    event: "error-occurred",
    operation: operation,
    error-code: error-code,
    timestamp: stacks-block-height
  })
)

;; Read-only functions
(define-read-only (get-claim (claim-id uint))
  (map-get? claims claim-id)
)

(define-read-only (get-claim-counter)
  (var-get claim-counter)
)

(define-read-only (has-policy-claim (policy-id uint))
  (is-some (map-get? policy-claims policy-id))
)

;; Public functions
(define-public (submit-claim 
  (policy-id uint)
  (tx-hex (buff 1024))
  (block-header (buff 80))
  (merkle-proof {tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint})
)
  (let (
    (new-claim-id (+ (var-get claim-counter) u1))
  )
    ;; Check for duplicate claims
    (asserts! (not (has-policy-claim policy-id)) ERR_DUPLICATE_CLAIM)
    
    ;; Validate that policy exists by calling policy-manager contract
    (asserts! (is-some (contract-call? .policy-manager get-policy policy-id)) ERR_POLICY_NOT_FOUND)
    
    ;; Validate that policy is active (not expired)
    (asserts! (contract-call? .policy-manager is-policy-active policy-id) ERR_POLICY_EXPIRED)
    
    ;; Validate that submitter is the policy holder
    (asserts! (contract-call? .policy-manager is-policy-holder policy-id tx-sender) ERR_NOT_POLICY_HOLDER)
    
    ;; Validate evidence completeness
    (asserts! (validate-claim-evidence tx-hex block-header merkle-proof) ERR_INVALID_PROOF)
    
    ;; Increment claim counter
    (var-set claim-counter new-claim-id)
    
    ;; Store claim with pending status
    (map-set claims new-claim-id {
      policy-id: policy-id,
      submitter: tx-sender,
      tx-hex: tx-hex,
      block-header: block-header,
      merkle-proof: merkle-proof,
      status: "pending",
      payout-amount: u0,
      verified-tx-hash: none
    })
    
    ;; Mark policy as having a claim
    (map-set policy-claims policy-id new-claim-id)
    
    ;; Emit claim submission event
    (print {
      event: "claim-submitted",
      claim-id: new-claim-id,
      policy-id: policy-id,
      submitter: tx-sender,
      policy-coverage: (get coverage-amount (unwrap-panic (contract-call? .policy-manager get-policy policy-id))),
      treasury-balance: (contract-call? .insurance-treasury-v2 get-available-balance)
    })
    
    (ok new-claim-id)
  )
)

(define-public (verify-and-payout (claim-id uint))
  (let (
    (claim (unwrap! (get-claim claim-id) ERR_CLAIM_NOT_FOUND))
  )
    ;; Check claim status
    (asserts! (is-eq (get status claim) "pending") ERR_INVALID_CLAIM_STATUS)
    
    ;; Get policy details to calculate payout
    (let (
      (policy (unwrap! (contract-call? .policy-manager get-policy (get policy-id claim)) ERR_POLICY_NOT_FOUND))
      (coverage-amount (get coverage-amount policy))
    )
      ;; Check treasury sufficiency using treasury contract function
      (asserts! (contract-call? .insurance-treasury-v2 check-payout-sufficiency coverage-amount) ERR_INSUFFICIENT_FUNDS)
      
      ;; Call clarity-bitcoin-lib to verify the transaction was mined
      ;; Using was-tx-mined-compact with height u0 (height validation can be added later)
      (match (contract-call? .clarity-bitcoin was-tx-mined-compact
        u0  ;; height parameter - can be enhanced to validate specific block height
        (get tx-hex claim)
        (get block-header claim)
        {
          tx-index: (get tx-index (get merkle-proof claim)),
          hashes: (expand-hashes-to-14 (get hashes (get merkle-proof claim))),
          tree-depth: (get tree-depth (get merkle-proof claim))
        })
        verified-tx-hash
        (begin
          ;; Verification succeeded - mark claim as verified
          (map-set claims claim-id 
            (merge claim { 
              status: "verified",
              payout-amount: coverage-amount,
              verified-tx-hash: (some verified-tx-hash)
            }))
          
          ;; Execute payout through treasury contract
          (try! (contract-call? .insurance-treasury-v2 payout-claim claim-id (get submitter claim) coverage-amount))
          
          ;; Update claim status to paid
          (map-set claims claim-id 
            (merge claim { 
              status: "paid",
              payout-amount: coverage-amount,
              verified-tx-hash: (some verified-tx-hash)
            }))
          
          ;; Emit verification and payout success event
          (print {
            event: "claim-verified-and-paid",
            claim-id: claim-id,
            policy-id: (get policy-id claim),
            tx-hash: verified-tx-hash,
            payout-amount: coverage-amount,
            recipient: (get submitter claim),
            treasury-balance-after: (contract-call? .insurance-treasury-v2 get-available-balance)
          })
          
          (ok coverage-amount)
        )
        error-code
        (begin
          ;; Verification failed - mark claim as rejected
          (map-set claims claim-id 
            (merge claim { status: "rejected" }))
          
          ;; Log verification failure
          (log-error "verify-and-payout" u32)
          
          ;; Emit verification failure event
          (print {
            event: "claim-rejected",
            claim-id: claim-id,
            reason: "bitcoin-verification-failed",
            error-code: error-code
          })
          
          ERR_VERIFICATION_FAILED
        )
      )
    )
  )
)

(define-public (verify-and-payout-with-reserve (claim-id uint))
  (let (
    (claim (unwrap! (get-claim claim-id) ERR_CLAIM_NOT_FOUND))
  )
    ;; Check claim status
    (asserts! (is-eq (get status claim) "pending") ERR_INVALID_CLAIM_STATUS)
    
    ;; Get policy details to calculate payout
    (let (
      (policy (unwrap! (contract-call? .policy-manager get-policy (get policy-id claim)) ERR_POLICY_NOT_FOUND))
      (coverage-amount (get coverage-amount policy))
    )
      ;; Check treasury sufficiency with reserve using enhanced function
      (asserts! (contract-call? .insurance-treasury-v2 check-payout-with-reserve coverage-amount) ERR_INSUFFICIENT_FUNDS)
      
      ;; Call clarity-bitcoin-lib to verify the transaction was mined
      (match (contract-call? .clarity-bitcoin was-tx-mined-compact
        u0
        (get tx-hex claim)
        (get block-header claim)
        {
          tx-index: (get tx-index (get merkle-proof claim)),
          hashes: (expand-hashes-to-14 (get hashes (get merkle-proof claim))),
          tree-depth: (get tree-depth (get merkle-proof claim))
        })
        verified-tx-hash
        (begin
          ;; Verification succeeded - mark claim as verified
          (map-set claims claim-id 
            (merge claim { 
              status: "verified",
              payout-amount: coverage-amount,
              verified-tx-hash: (some verified-tx-hash)
            }))
          
          ;; Execute atomic payout with reserve check through treasury contract
          (try! (contract-call? .insurance-treasury-v2 atomic-payout-with-reserve-check claim-id (get submitter claim) coverage-amount))
          
          ;; Update claim status to paid
          (map-set claims claim-id 
            (merge claim { 
              status: "paid",
              payout-amount: coverage-amount,
              verified-tx-hash: (some verified-tx-hash)
            }))
          
          ;; Emit verification and payout success event
          (print {
            event: "claim-verified-and-paid-with-reserve",
            claim-id: claim-id,
            policy-id: (get policy-id claim),
            tx-hash: verified-tx-hash,
            payout-amount: coverage-amount,
            recipient: (get submitter claim),
            treasury-balance-after: (contract-call? .insurance-treasury-v2 get-available-balance),
            reserve-protected: true
          })
          
          (ok coverage-amount)
        )
        error-code
        (begin
          ;; Verification failed - mark claim as rejected
          (map-set claims claim-id 
            (merge claim { status: "rejected" }))
          
          ;; Log verification failure
          (log-error "verify-and-payout-with-reserve" u32)
          
          ;; Emit verification failure event
          (print {
            event: "claim-rejected",
            claim-id: claim-id,
            reason: "bitcoin-verification-failed",
            error-code: error-code
          })
          
          ERR_VERIFICATION_FAILED
        )
      )
    )
  )
)

;; Helper function to expand 12-element hash list to 14-element list for clarity-bitcoin compatibility
(define-private (expand-hashes-to-14 (hashes-12 (list 12 (buff 32))))
  (let (
    (empty-hash 0x0000000000000000000000000000000000000000000000000000000000000000)
  )
    ;; Append two empty hashes to make it 14 elements
    (unwrap-panic (as-max-len? (concat hashes-12 (list empty-hash empty-hash)) u14))
  )
)

;; Administrative functions
(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set contract-owner new-owner)
    (ok true)
  )
)