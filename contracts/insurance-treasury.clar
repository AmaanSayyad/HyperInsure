;; Insurance Treasury Contract
;; Manages collection of premiums and payment of claims

;; Define data variables
(define-data-var treasury-balance uint u0)
(define-data-var admin principal tx-sender)
(define-data-var min-delay-blocks uint u35)
(define-data-var claim-fee-basis-points uint u100) ;; 1% fee

;; Define data maps
(define-map policies
  { policy-id: uint }
  {
    name: (string-ascii 100),
    description: (string-ascii 255),
    premium-basis-points: uint,
    payout-amount: uint,
    delay-threshold: uint,
    created-at: uint,
    active: bool
  }
)

(define-map purchases
  { purchase-id: uint }
  {
    policy-id: uint,
    purchaser: principal,
    amount: uint,
    purchase-block: uint,
    active: bool
  }
)

(define-map claims
  { claim-id: uint }
  {
    purchase-id: uint,
    tx-hash: (buff 32),
    block-height: uint,
    delay-blocks: uint,
    amount: uint,
    status: (string-ascii 20),
    processed: bool
  }
)

;; Define counters
(define-data-var policy-counter uint u0)
(define-data-var purchase-counter uint u0)
(define-data-var claim-counter uint u0)

;; Define read-only functions
(define-read-only (get-treasury-balance)
  (var-get treasury-balance)
)

(define-read-only (get-policy (policy-id uint))
  (map-get? policies { policy-id: policy-id })
)

(define-read-only (get-purchase (purchase-id uint))
  (map-get? purchases { purchase-id: purchase-id })
)

(define-read-only (get-claim (claim-id uint))
  (map-get? claims { claim-id: claim-id })
)

;; Define public functions
(define-public (create-policy (name (string-ascii 100)) 
                             (description (string-ascii 255)) 
                             (premium-basis-points uint) 
                             (payout-amount uint)
                             (delay-threshold uint))
  (begin
    ;; Only admin can create policies
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    
    ;; Increment policy counter
    (var-set policy-counter (+ (var-get policy-counter) u1))
    
    ;; Store policy data
    (map-set policies
      { policy-id: (var-get policy-counter) }
      {
        name: name,
        description: description,
        premium-basis-points: premium-basis-points,
        payout-amount: payout-amount,
        delay-threshold: delay-threshold,
        created-at: block-height,
        active: true
      }
    )
    
    ;; Return policy ID
    (ok (var-get policy-counter))
  )
)

(define-public (purchase-insurance (policy-id uint) (amount uint))
  (let (
    (policy (unwrap! (get-policy policy-id) (err u404)))
    (premium-amount (/ (* amount (get premium-basis-points policy)) u10000))
  )
    ;; Check if policy exists and is active
    (asserts! (get active policy) (err u403))
    
    ;; Check if amount is sufficient for premium
    (asserts! (>= amount premium-amount) (err u400))
    
    ;; Transfer STX to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    ;; Increment purchase counter
    (var-set purchase-counter (+ (var-get purchase-counter) u1))
    
    ;; Update treasury balance
    (var-set treasury-balance (+ (var-get treasury-balance) amount))
    
    ;; Store purchase data
    (map-set purchases
      { purchase-id: (var-get purchase-counter) }
      {
        policy-id: policy-id,
        purchaser: tx-sender,
        amount: amount,
        purchase-block: block-height,
        active: true
      }
    )
    
    ;; Return purchase ID
    (ok (var-get purchase-counter))
  )
)

(define-public (submit-claim (purchase-id uint) (tx-hash (buff 32)) (block-height uint))
  (let (
    (purchase (unwrap! (get-purchase purchase-id) (err u404)))
    (policy (unwrap! (get-policy (get policy-id purchase)) (err u404)))
    (delay-blocks (- block-height (get purchase-block purchase)))
    (payout-amount (get payout-amount policy))
  )
    ;; Check if purchase exists and is active
    (asserts! (get active purchase) (err u403))
    
    ;; Check if purchaser is the one submitting the claim
    (asserts! (is-eq tx-sender (get purchaser purchase)) (err u403))
    
    ;; Check if delay meets the threshold
    (asserts! (>= delay-blocks (get delay-threshold policy)) (err u400))
    
    ;; Check if treasury has enough balance
    (asserts! (>= (var-get treasury-balance) payout-amount) (err u500))
    
    ;; Increment claim counter
    (var-set claim-counter (+ (var-get claim-counter) u1))
    
    ;; Store claim data
    (map-set claims
      { claim-id: (var-get claim-counter) }
      {
        purchase-id: purchase-id,
        tx-hash: tx-hash,
        block-height: block-height,
        delay-blocks: delay-blocks,
        amount: payout-amount,
        status: "approved",
        processed: false
      }
    )
    
    ;; Process the claim
    (try! (process-claim (var-get claim-counter)))
    
    ;; Return claim ID
    (ok (var-get claim-counter))
  )
)

(define-public (process-claim (claim-id uint))
  (let (
    (claim (unwrap! (get-claim claim-id) (err u404)))
    (purchase (unwrap! (get-purchase (get purchase-id claim)) (err u404)))
    (payout-amount (get amount claim))
    (fee-amount (/ (* payout-amount (var-get claim-fee-basis-points)) u10000))
    (net-payout (- payout-amount fee-amount))
  )
    ;; Check if claim exists and is not processed
    (asserts! (not (get processed claim)) (err u403))
    
    ;; Check if treasury has enough balance
    (asserts! (>= (var-get treasury-balance) payout-amount) (err u500))
    
    ;; Transfer STX to claimant
    (try! (as-contract (stx-transfer? net-payout (as-contract tx-sender) (get purchaser purchase))))
    
    ;; Update treasury balance
    (var-set treasury-balance (- (var-get treasury-balance) payout-amount))
    
    ;; Mark purchase as inactive
    (map-set purchases
      { purchase-id: (get purchase-id claim) }
      (merge (get-purchase (get purchase-id claim)) { active: false })
    )
    
    ;; Mark claim as processed
    (map-set claims
      { claim-id: claim-id }
      (merge claim { processed: true })
    )
    
    ;; Return success
    (ok true)
  )
)

;; Admin functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (var-set admin new-admin)
    (ok true)
  )
)

(define-public (set-min-delay-blocks (blocks uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (var-set min-delay-blocks blocks)
    (ok true)
  )
)

(define-public (set-claim-fee (basis-points uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (var-set claim-fee-basis-points basis-points)
    (ok true)
  )
)

(define-public (withdraw-fees (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (asserts! (<= amount (var-get treasury-balance)) (err u400))
    (try! (as-contract (stx-transfer? amount (as-contract tx-sender) (var-get admin))))
    (var-set treasury-balance (- (var-get treasury-balance) amount))
    (ok true)
  )
)

;; Emergency functions
(define-public (toggle-policy (policy-id uint) (active bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (let ((policy (unwrap! (get-policy policy-id) (err u404))))
      (map-set policies
        { policy-id: policy-id }
        (merge policy { active: active })
      )
    )
    (ok true)
  )
)
