;; Simple Insurance Treasury Contract
;; Manages collection of premiums and payment of claims

;; Define data variables
(define-data-var treasury-balance uint u0)
(define-data-var admin principal tx-sender)
(define-data-var min-delay-blocks uint u35)

;; Define data maps
(define-map policies
  { id: uint }
  {
    name: (string-ascii 50),
    delay-threshold: uint,
    premium-percent: uint,
    payout-amount: uint,
    active: bool
  }
)

(define-map purchases
  { id: uint }
  {
    policy-id: uint,
    purchaser: principal,
    amount: uint,
    block-height: uint
  }
)

(define-map claims
  { id: uint }
  {
    purchase-id: uint,
    tx-hash: (buff 32),
    block-height: uint,
    paid: bool
  }
)

;; Define counters
(define-data-var policy-id-counter uint u0)
(define-data-var purchase-id-counter uint u0)
(define-data-var claim-id-counter uint u0)

;; Read-only functions
(define-read-only (get-balance)
  (var-get treasury-balance)
)

(define-read-only (get-policy (id uint))
  (map-get? policies { id: id })
)

;; Public functions
(define-public (create-policy (name (string-ascii 50)) (delay-threshold uint) (premium-percent uint) (payout-amount uint))
  (begin
    ;; Only admin can create policies
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    
    ;; Increment policy counter
    (var-set policy-id-counter (+ (var-get policy-id-counter) u1))
    
    ;; Store policy
    (map-set policies
      { id: (var-get policy-id-counter) }
      {
        name: name,
        delay-threshold: delay-threshold,
        premium-percent: premium-percent,
        payout-amount: payout-amount,
        active: true
      }
    )
    
    ;; Return policy ID
    (ok (var-get policy-id-counter))
  )
)

(define-public (buy-insurance (policy-id uint) (amount uint))
  (let (
    (policy (unwrap! (map-get? policies { id: policy-id }) (err u404)))
  )
    ;; Check if policy is active
    (asserts! (get active policy) (err u101))
    
    ;; Transfer STX to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    ;; Increment purchase counter
    (var-set purchase-id-counter (+ (var-get purchase-id-counter) u1))
    
    ;; Update treasury balance
    (var-set treasury-balance (+ (var-get treasury-balance) amount))
    
    ;; Store purchase
    (map-set purchases
      { id: (var-get purchase-id-counter) }
      {
        policy-id: policy-id,
        purchaser: tx-sender,
        amount: amount,
        block-height: block-height
      }
    )
    
    ;; Return purchase ID
    (ok (var-get purchase-id-counter))
  )
)

;; Read-only function to verify delay using block heights
(define-read-only (verify-delay (broadcast-height uint) (inclusion-height uint) (required-delay uint))
  (let (
    (actual-delay (- inclusion-height broadcast-height))
  )
    {
      actual-delay: actual-delay,
      required-delay: required-delay,
      is-eligible: (>= actual-delay required-delay)
    }
  )
)

(define-public (submit-claim (purchase-id uint) (tx-hash (buff 32)) (block-height uint))
  (let (
    (purchase (unwrap! (map-get? purchases { id: purchase-id }) (err u404)))
    (policy (unwrap! (map-get? policies { id: (get policy-id purchase) }) (err u404)))
    (verification (verify-delay (get block-height purchase) block-height (get delay-threshold policy)))
    (payout (get payout-amount policy))
  )
    ;; Check if purchaser is claiming
    (asserts! (is-eq tx-sender (get purchaser purchase)) (err u102))
    
    ;; Check if delay meets threshold using our verification function
    (asserts! (get is-eligible verification) (err u103))
    
    ;; Check treasury balance
    (asserts! (>= (var-get treasury-balance) payout) (err u104))
    
    ;; Increment claim counter
    (var-set claim-id-counter (+ (var-get claim-id-counter) u1))
    
    ;; Store claim with delay information
    (map-set claims
      { id: (var-get claim-id-counter) }
      {
        purchase-id: purchase-id,
        tx-hash: tx-hash,
        block-height: block-height,
        paid: false
      }
    )
    
    ;; Process payout
    (try! (as-contract (stx-transfer? payout (as-contract tx-sender) (get purchaser purchase))))
    
    ;; Update treasury balance
    (var-set treasury-balance (- (var-get treasury-balance) payout))
    
    ;; Mark claim as paid
    (map-set claims
      { id: (var-get claim-id-counter) }
      {
        purchase-id: purchase-id,
        tx-hash: tx-hash,
        block-height: block-height,
        paid: true
      }
    )
    
    ;; Return claim ID
    (ok (var-get claim-id-counter))
  )
)

;; Admin functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u105))
    (var-set admin new-admin)
    (ok true)
  )
)

(define-public (withdraw (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u105))
    (asserts! (<= amount (var-get treasury-balance)) (err u106))
    (try! (as-contract (stx-transfer? amount (as-contract tx-sender) (var-get admin))))
    (var-set treasury-balance (- (var-get treasury-balance) amount))
    (ok true)
  )
)
