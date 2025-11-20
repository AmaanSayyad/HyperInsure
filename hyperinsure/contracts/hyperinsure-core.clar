;; HyperInsure Core Contract - Simplified
;; This contract manages policies, purchases, and claims

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_POLICY_EXISTS u2)
(define-constant ERR_POLICY_NOT_FOUND u3)
(define-constant ERR_PURCHASE_NOT_FOUND u4)
(define-constant ERR_INSUFFICIENT_FUNDS u5)
(define-constant ERR_INVALID_PARAMETER u6)
(define-constant ERR_CLAIM_EXISTS u7)
(define-constant ERR_CLAIM_NOT_FOUND u8)
(define-constant ERR_PURCHASE_EXISTS u9)
(define-constant ERR_PURCHASE_EXPIRED u10)
(define-constant ERR_POLICY_INACTIVE u11)
(define-constant ERR_PURCHASE_INACTIVE u12)
(define-constant ERR_ALREADY_CLAIMED u14)

;; Claim status
(define-constant CLAIM_STATUS_PENDING u1)
(define-constant CLAIM_STATUS_APPROVED u2)
(define-constant CLAIM_STATUS_REJECTED u3)
(define-constant CLAIM_STATUS_PAID u4)

;; Data maps and variables
(define-map policies
  { policy-id: (string-ascii 20) }
  {
    name: (string-ascii 100),
    description: (string-utf8 500),
    delay-threshold: uint,
    premium-percentage: uint,  ;; basis points (100 = 1%)
    protocol-fee: uint,        ;; basis points (100 = 1%)
    payout-per-incident: uint, ;; in STX
    active: bool,
    created-at: uint,
    created-by: principal
  }
)

(define-map policy-purchases
  { purchase-id: (string-ascii 36) }
  {
    policy-id: (string-ascii 20),
    purchaser: principal,
    stx-amount: uint,
    premium-paid: uint,
    fee-paid: uint,
    active: bool,
    created-at: uint,
    expiry: uint
  }
)

(define-map claims
  { claim-id: (string-ascii 36) }
  {
    purchase-id: (string-ascii 36),
    tx-hash: (buff 32),
    claimer: principal,
    delay-blocks: uint,
    policy-id: (string-ascii 20),
    payout-amount: uint,
    status: uint,
    created-at: uint,
    processed-at: (optional uint),
    processed-by: (optional principal)
  }
)

;; Admin and counters
(define-data-var admin principal tx-sender)
(define-data-var policy-count uint u0)
(define-data-var purchase-count uint u0)
(define-data-var claim-count uint u0)
(define-data-var total-deposits uint u0)
(define-data-var total-payouts uint u0)
(define-data-var reserve-ratio uint u5000) ;; 50% in basis points

;; Read-only functions
(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (get-policy (policy-id (string-ascii 20)))
  (map-get? policies { policy-id: policy-id })
)

(define-read-only (get-purchase (purchase-id (string-ascii 36)))
  (map-get? policy-purchases { purchase-id: purchase-id })
)

(define-read-only (get-claim (claim-id (string-ascii 36)))
  (map-get? claims { claim-id: claim-id })
)

(define-read-only (get-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (calculate-premium (policy-id (string-ascii 20)) (stx-amount uint))
  (match (get-policy policy-id)
    policy (let (
      (premium-rate (get premium-percentage policy))
    )
      (/ (* stx-amount premium-rate) u10000)
    )
    u0
  )
)

(define-read-only (calculate-fee (policy-id (string-ascii 20)) (stx-amount uint))
  (match (get-policy policy-id)
    policy (let (
      (fee-rate (get protocol-fee policy))
    )
      (/ (* stx-amount fee-rate) u10000)
    )
    u0
  )
)

;; Policy management functions
(define-public (create-policy 
  (policy-id (string-ascii 20))
  (name (string-ascii 100))
  (description (string-utf8 500))
  (delay-threshold uint)
  (premium-percentage uint)
  (protocol-fee uint)
  (payout-per-incident uint)
)
  (begin
    ;; Only admin can create policies
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    
    ;; Validate policy parameters
    (asserts! (> delay-threshold u0) (err ERR_INVALID_PARAMETER))
    (asserts! (and (> premium-percentage u0) (<= premium-percentage u10000)) (err ERR_INVALID_PARAMETER))
    (asserts! (and (>= protocol-fee u0) (<= protocol-fee u10000)) (err ERR_INVALID_PARAMETER))
    (asserts! (> payout-per-incident u0) (err ERR_INVALID_PARAMETER))
    
    ;; Ensure policy doesn't already exist
    (asserts! (is-none (get-policy policy-id)) (err ERR_POLICY_EXISTS))
    
    ;; Create the policy
    (map-set policies
      { policy-id: policy-id }
      {
        name: name,
        description: description,
        delay-threshold: delay-threshold,
        premium-percentage: premium-percentage,
        protocol-fee: protocol-fee,
        payout-per-incident: payout-per-incident,
        active: true,
        created-at: stacks-block-height,
        created-by: tx-sender
      }
    )
    
    ;; Increment policy count
    (var-set policy-count (+ (var-get policy-count) u1))
    
    (ok policy-id)
  )
)

(define-public (purchase-policy 
  (policy-id (string-ascii 20))
  (stx-amount uint)
  (purchase-id (string-ascii 36))
)
  (let (
    (policy (unwrap! (get-policy policy-id) (err ERR_POLICY_NOT_FOUND)))
    (premium (calculate-premium policy-id stx-amount))
    (fee (calculate-fee policy-id stx-amount))
    (total-cost (+ premium fee))
  )
    (begin
      ;; Ensure purchase doesn't already exist
      (asserts! (is-none (get-purchase purchase-id)) (err ERR_PURCHASE_EXISTS))
      
      ;; Ensure policy is active
      (asserts! (get active policy) (err ERR_POLICY_INACTIVE))
      
      ;; Ensure user has enough funds
      (asserts! (>= (stx-get-balance tx-sender) total-cost) (err ERR_INSUFFICIENT_FUNDS))
      
      ;; Transfer premium and fee to this contract
      (try! (stx-transfer? total-cost tx-sender (as-contract tx-sender)))
      
      ;; Update total deposits
      (var-set total-deposits (+ (var-get total-deposits) total-cost))
      
      ;; Record the purchase
      (map-set policy-purchases
        { purchase-id: purchase-id }
        {
          policy-id: policy-id,
          purchaser: tx-sender,
          stx-amount: stx-amount,
          premium-paid: premium,
          fee-paid: fee,
          active: true,
          created-at: stacks-block-height,
          expiry: (+ stacks-block-height u1008) ;; ~1 week (144 blocks per day * 7 days)
        }
      )
      
      ;; Increment purchase count
      (var-set purchase-count (+ (var-get purchase-count) u1))
      
      (ok purchase-id)
    )
  )
)

;; Claims processing functions
(define-public (submit-claim 
  (claim-id (string-ascii 36))
  (purchase-id (string-ascii 36))
  (tx-hash (buff 32))
  (delay-blocks uint)
)
  (let (
    (purchase (unwrap! (get-purchase purchase-id) (err ERR_PURCHASE_NOT_FOUND)))
    (policy-id (get policy-id purchase))
    (policy (unwrap! (get-policy policy-id) (err ERR_POLICY_NOT_FOUND)))
    (delay-threshold (get delay-threshold policy))
    (payout-amount (get payout-per-incident policy))
  )
    (begin
      ;; Ensure claim doesn't already exist
      (asserts! (is-none (get-claim claim-id)) (err ERR_CLAIM_EXISTS))
      
      ;; Ensure purchase is active and not expired
      (asserts! (get active purchase) (err ERR_PURCHASE_INACTIVE))
      (asserts! (<= stacks-block-height (get expiry purchase)) (err ERR_PURCHASE_EXPIRED))
      
      ;; Ensure claimer is the purchaser
      (asserts! (is-eq tx-sender (get purchaser purchase)) (err ERR_UNAUTHORIZED))
      
      ;; Check if delay is sufficient
      (asserts! (>= delay-blocks delay-threshold) (err ERR_INVALID_PARAMETER))
      
      ;; Create the claim
      (map-set claims
        { claim-id: claim-id }
        {
          purchase-id: purchase-id,
          tx-hash: tx-hash,
          claimer: tx-sender,
          delay-blocks: delay-blocks,
          policy-id: policy-id,
          payout-amount: payout-amount,
          status: CLAIM_STATUS_PENDING,
          created-at: stacks-block-height,
          processed-at: none,
          processed-by: none
        }
      )
      
      ;; Increment claim count
      (var-set claim-count (+ (var-get claim-count) u1))
      
      (ok claim-id)
    )
  )
)

(define-public (process-claim (claim-id (string-ascii 36)) (status uint))
  (let (
    (claim (unwrap! (get-claim claim-id) (err ERR_CLAIM_NOT_FOUND)))
    (payout-amount (get payout-amount claim))
    (recipient (get claimer claim))
  )
    (begin
      ;; Only admin can process claims
      (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
      
      ;; Ensure claim is pending
      (asserts! (is-eq (get status claim) CLAIM_STATUS_PENDING) (err ERR_ALREADY_CLAIMED))
      
      ;; Validate status
      (asserts! (or 
                  (is-eq status CLAIM_STATUS_APPROVED)
                  (is-eq status CLAIM_STATUS_REJECTED)
                ) 
                (err ERR_INVALID_PARAMETER))
      
      ;; Process payout if approved
      (if (is-eq status CLAIM_STATUS_APPROVED)
        (begin
          ;; Check if contract has enough funds
          (asserts! (>= (stx-get-balance (as-contract tx-sender)) payout-amount) (err ERR_INSUFFICIENT_FUNDS))
          
          ;; Process the payout
          (try! (as-contract (stx-transfer? payout-amount tx-sender recipient)))
          
          ;; Update total payouts
          (var-set total-payouts (+ (var-get total-payouts) payout-amount))
          
          ;; Update claim status to paid
          (map-set claims
            { claim-id: claim-id }
            (merge claim 
              { 
                status: CLAIM_STATUS_PAID,
                processed-at: (some stacks-block-height),
                processed-by: (some tx-sender)
              }
            )
          )
          
          (ok claim-id)
        )
        (begin
          ;; Update claim status to rejected
          (map-set claims
            { claim-id: claim-id }
            (merge claim 
              { 
                status: status,
                processed-at: (some stacks-block-height),
                processed-by: (some tx-sender)
              }
            )
          )
          (ok claim-id)
        )
      )
    )
  )
)

(define-public (pay-claim (claim-id (string-ascii 36)))
  (let (
    (claim (unwrap! (get-claim claim-id) (err ERR_CLAIM_NOT_FOUND)))
    (payout-amount (get payout-amount claim))
    (recipient (get claimer claim))
  )
    (begin
      ;; Only admin can pay claims
      (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
      
      ;; Ensure claim is approved
      (asserts! (is-eq (get status claim) CLAIM_STATUS_APPROVED) (err ERR_INVALID_PARAMETER))
      
      ;; Check if contract has enough funds
      (asserts! (>= (stx-get-balance (as-contract tx-sender)) payout-amount) (err ERR_INSUFFICIENT_FUNDS))
      
      ;; Process the payout
      (try! (as-contract (stx-transfer? payout-amount tx-sender recipient)))
      
      ;; Update total payouts
      (var-set total-payouts (+ (var-get total-payouts) payout-amount))
      
      ;; Update claim status to paid
      (map-set claims
        { claim-id: claim-id }
        (merge claim { status: CLAIM_STATUS_PAID })
      )
      
      (ok claim-id)
    )
  )
)

;; Admin functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set admin new-admin)
    (ok true)
  )
)

(define-public (fund-contract (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (ok true)
  )
)

(define-public (set-reserve-ratio (new-ratio uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (<= new-ratio u10000) (err ERR_INVALID_PARAMETER))
    (var-set reserve-ratio new-ratio)
    (ok true)
  )
)

(define-public (update-policy-status (policy-id (string-ascii 20)) (active bool))
  (begin
    ;; Only admin can update policy status
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    
    ;; Ensure policy exists
    (asserts! (is-some (get-policy policy-id)) (err ERR_POLICY_NOT_FOUND))
    
    ;; Update the policy status
    (match (get-policy policy-id)
      policy
      (begin
        (map-set policies
          { policy-id: policy-id }
          (merge policy { active: active })
        )
        (ok true)
      )
      (err ERR_POLICY_NOT_FOUND)
    )
  )
)

;; FUZZ TESTING - INVARIANTS

;; Invariant: Reserve ratio must be between 0 and 10000 (100%)
(define-read-only (invariant-reserve-ratio-valid)
  (let
    ((ratio (var-get reserve-ratio)))
    (and (>= ratio u0) (<= ratio u10000))
  )
)

;; FUZZ TESTING - PROPERTY-BASED TESTS

;; Helper: Ensure test policy exists
(define-private (ensure-test-policy)
  (if (is-none (get-policy "test-policy"))
    (create-policy
      "test-policy"
      "Test Policy"
      u"Policy for fuzz testing"
      u35
      u200 ;; 2%
      u100 ;; 1%
      u1000000
    )
    (ok "test-policy")
  )
)

;; Test: Premium calculation is consistent
(define-public (test-premium-calculation (stx-amount uint))
  (begin
    (if (or (<= stx-amount u0) (not (is-eq tx-sender (var-get admin))))
      (ok false) ;; Discard invalid inputs or non-admin
      (begin
        (try! (ensure-test-policy))
        (let
          (
            (calculated-premium (calculate-premium "test-policy" stx-amount))
            (expected-premium (/ (* stx-amount u200) u10000))
          )
          (asserts! (is-eq calculated-premium expected-premium) (err u993))
          (ok true)
        )
      )
    )
  )
)

;; Test: Fee calculation is consistent
(define-public (test-fee-calculation (stx-amount uint))
  (begin
    (if (or (<= stx-amount u0) (not (is-eq tx-sender (var-get admin))))
      (ok false) ;; Discard invalid inputs or non-admin
      (begin
        (try! (ensure-test-policy))
        (let
          (
            (calculated-fee (calculate-fee "test-policy" stx-amount))
            (expected-fee (/ (* stx-amount u100) u10000))
          )
          (asserts! (is-eq calculated-fee expected-fee) (err u992))
          (ok true)
        )
      )
    )
  )
)
