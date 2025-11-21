;; Insurance Treasury Contract v2
;; Manages insurance funds and automated payouts for the claim verification system
;; This contract is part of the insurance claim verification system

;; Error codes - using centralized error codes
(define-constant ERR_INSUFFICIENT_FUNDS (err u1))
(define-constant ERR_UNAUTHORIZED (err u6))
(define-constant ERR_INVALID_AMOUNT (err u7))
(define-constant ERR_CLAIM_NOT_FOUND (err u21))
(define-constant ERR_NOT_AUTHORIZED_FUNDER (err u6))
(define-constant ERR_TRANSFER_FAILED (err u62))

;; Data variables for treasury management
(define-data-var total-pool-balance uint u0)
(define-data-var total-funded uint u0)
(define-data-var total-paid-out uint u0)
(define-data-var reserve-percentage uint u10) ;; 10% reserve by default

;; Maps for tracking authorized funders and balances
(define-map authorized-funders principal bool)
(define-map funder-balances principal uint)

;; Events
(define-data-var contract-owner principal tx-sender)

;; Initialize contract owner as authorized funder
(map-set authorized-funders tx-sender true)

;; Validation functions
(define-private (validate-amount (amount uint))
  (and (> amount u0) (<= amount u1000000000000))
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
(define-read-only (get-treasury-balance)
  (var-get total-pool-balance)
)

(define-read-only (get-total-funded)
  (var-get total-funded)
)

(define-read-only (get-available-balance)
  (var-get total-pool-balance)
)

(define-read-only (get-total-paid-out)
  (var-get total-paid-out)
)

(define-read-only (is-authorized-funder (funder principal))
  (default-to false (map-get? authorized-funders funder))
)

(define-read-only (check-payout-sufficiency (amount uint))
  (<= amount (var-get total-pool-balance))
)

(define-read-only (get-available-for-payout)
  ;; Calculate available balance minus reserve
  (let (
    (total-balance (var-get total-pool-balance))
    (reserve-amount (/ (* total-balance (var-get reserve-percentage)) u100))
  )
    (if (> total-balance reserve-amount)
      (- total-balance reserve-amount)
      u0
    )
  )
)

(define-read-only (check-payout-with-reserve (amount uint))
  (<= amount (get-available-for-payout))
)

(define-read-only (get-reserve-amount)
  (let (
    (total-balance (var-get total-pool-balance))
  )
    (/ (* total-balance (var-get reserve-percentage)) u100)
  )
)

;; Public functions
(define-public (receive-premium (policy-id uint) (amount uint) (from principal))
  (begin
    ;; Only allow policy-manager contract to call this function
    (asserts! (is-eq contract-caller .policy-manager) ERR_UNAUTHORIZED)
    
    ;; Validate amount
    (asserts! (validate-amount amount) ERR_INVALID_AMOUNT)
    
    ;; Update treasury balances (premium is already transferred to policy-manager, 
    ;; this function just tracks it in treasury accounting)
    (var-set total-pool-balance (+ (var-get total-pool-balance) amount))
    (var-set total-funded (+ (var-get total-funded) amount))
    
    ;; Emit premium received event
    (print {
      event: "premium-received",
      policy-id: policy-id,
      amount: amount,
      from: from,
      new-balance: (var-get total-pool-balance),
      caller: contract-caller
    })
    
    (ok amount)
  )
)

(define-public (fund-treasury (amount uint))
  (begin
    ;; Validate amount
    (asserts! (validate-amount amount) ERR_INVALID_AMOUNT)
    
    ;; Check if sender is authorized funder
    (asserts! (is-authorized-funder tx-sender) ERR_NOT_AUTHORIZED_FUNDER)
    
    ;; Transfer STX to contract
    (match (stx-transfer? amount tx-sender (as-contract tx-sender))
      success
      (begin
        ;; Update balances
        (var-set total-pool-balance (+ (var-get total-pool-balance) amount))
        (var-set total-funded (+ (var-get total-funded) amount))
        
        ;; Update funder balance
        (map-set funder-balances tx-sender 
          (+ (default-to u0 (map-get? funder-balances tx-sender)) amount))
        
        ;; Emit funding event
        (print {
          event: "treasury-funded",
          funder: tx-sender,
          amount: amount,
          new-balance: (var-get total-pool-balance)
        })
        
        (ok amount)
      )
      error
      (begin
        ;; Log transfer failure
        (log-error "fund-treasury" u62)
        ERR_TRANSFER_FAILED
      )
    )
  )
)

(define-public (payout-claim (claim-id uint) (recipient principal) (amount uint))
  (begin
    ;; Only allow authorized contracts to call this function
    (asserts! (or 
      (is-eq contract-caller .claim-processor)
      (is-eq tx-sender (var-get contract-owner))) ERR_UNAUTHORIZED)
    
    ;; Validate amount
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (<= amount (var-get total-pool-balance)) ERR_INSUFFICIENT_FUNDS)
    
    ;; Transfer payout to recipient
    (match (as-contract (stx-transfer? amount (as-contract tx-sender) recipient))
      success
      (begin
        ;; Update balances
        (var-set total-pool-balance (- (var-get total-pool-balance) amount))
        (var-set total-paid-out (+ (var-get total-paid-out) amount))
        
        ;; Emit payout event
        (print {
          event: "claim-payout",
          claim-id: claim-id,
          recipient: recipient,
          amount: amount,
          remaining-balance: (var-get total-pool-balance),
          caller: contract-caller
        })
        
        (ok amount)
      )
      error
      (begin
        ;; Log payout failure
        (log-error "payout-claim" u62)
        ERR_TRANSFER_FAILED
      )
    )
  )
)

(define-public (atomic-payout-with-reserve-check (claim-id uint) (recipient principal) (amount uint))
  (begin
    ;; Only allow authorized contracts to call this function
    (asserts! (or 
      (is-eq contract-caller .claim-processor)
      (is-eq tx-sender (var-get contract-owner))) ERR_UNAUTHORIZED)
    
    ;; Validate amount
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Check sufficiency with reserve calculation
    (asserts! (check-payout-with-reserve amount) ERR_INSUFFICIENT_FUNDS)
    
    ;; Store original balance for potential rollback
    (let (
      (original-balance (var-get total-pool-balance))
      (original-paid-out (var-get total-paid-out))
    )
      ;; Attempt atomic payout
      (match (as-contract (stx-transfer? amount (as-contract tx-sender) recipient))
        success
        (begin
          ;; Update balances atomically
          (var-set total-pool-balance (- original-balance amount))
          (var-set total-paid-out (+ original-paid-out amount))
          
          ;; Emit successful payout event
          (print {
            event: "atomic-payout-success",
            claim-id: claim-id,
            recipient: recipient,
            amount: amount,
            remaining-balance: (var-get total-pool-balance),
            reserve-amount: (get-reserve-amount),
            available-for-payout: (get-available-for-payout)
          })
          
          (ok amount)
        )
        error
        (begin
          ;; Rollback is automatic since var-set operations haven't occurred
          ;; Log atomic payout failure
          (log-error "atomic-payout-with-reserve-check" u62)
          
          ;; Emit rollback event
          (print {
            event: "atomic-payout-rollback",
            claim-id: claim-id,
            recipient: recipient,
            amount: amount,
            reason: "transfer-failed",
            balance-preserved: original-balance
          })
          
          ERR_TRANSFER_FAILED
        )
      )
    )
  )
)

;; Administrative functions
(define-public (authorize-funder (funder principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set authorized-funders funder true)
    (ok true)
  )
)

(define-public (revoke-funder (funder principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set authorized-funders funder false)
    (ok true)
  )
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-public (set-reserve-percentage (new-percentage uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (asserts! (<= new-percentage u50) ERR_INVALID_AMOUNT) ;; Max 50% reserve
    (var-set reserve-percentage new-percentage)
    
    ;; Emit reserve percentage change event
    (print {
      event: "reserve-percentage-updated",
      old-percentage: (var-get reserve-percentage),
      new-percentage: new-percentage,
      new-reserve-amount: (get-reserve-amount)
    })
    
    (ok true)
  )
)