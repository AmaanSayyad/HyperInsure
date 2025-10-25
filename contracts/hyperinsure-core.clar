;; HyperInsure Core Contract
;; This contract combines policy management, claims processing, and treasury functions

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_POLICY_EXISTS u2)
(define-constant ERR_POLICY_NOT_FOUND u3)
(define-constant ERR_PURCHASE_NOT_FOUND u4)
(define-constant ERR_INSUFFICIENT_FUNDS u5)
(define-constant ERR_INVALID_PARAMETER u6)
(define-constant ERR_CLAIM_EXISTS u7)
(define-constant ERR_CLAIM_NOT_FOUND u8)
(define-constant ERR_ATTESTATION_NOT_FOUND u9)
(define-constant ERR_INSUFFICIENT_DELAY u10)
(define-constant ERR_POLICY_INACTIVE u11)
(define-constant ERR_PURCHASE_INACTIVE u12)
(define-constant ERR_PURCHASE_EXPIRED u13)
(define-constant ERR_ALREADY_CLAIMED u14)
(define-constant ERR_PAYOUT_FAILED u15)

;; Claim status
(define-constant CLAIM_STATUS_PENDING u1)
(define-constant CLAIM_STATUS_APPROVED u2)
(define-constant CLAIM_STATUS_REJECTED u3)
(define-constant CLAIM_STATUS_PAID u4)

;; Contract references
(define-data-var oracle-contract principal tx-sender)
(define-data-var governance-contract principal tx-sender)

;; Data maps and variables
;; Policy management
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

;; Claims management
(define-map claims
  { claim-id: (string-ascii 36) }
  {
    purchase-id: (string-ascii 36),
    tx-hash: (buff 32),
    claimer: principal,
    broadcast-height: uint,
    inclusion-height: uint,
    delay-blocks: uint,
    policy-id: (string-ascii 20),
    payout-amount: uint,
    status: uint,
    created-at: uint,
    processed-at: (optional uint),
    processed-by: (optional principal)
  }
)

;; Treasury management
(define-data-var reserve-ratio uint u5000) ;; 50% in basis points

;; Admin and counters
(define-data-var admin principal tx-sender)
(define-data-var policy-count uint u0)
(define-data-var purchase-count uint u0)
(define-data-var claim-count uint u0)
(define-data-var total-deposits uint u0)
(define-data-var total-payouts uint u0)
(define-data-var auto-approve bool true)

;; Read-only functions
(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (get-oracle-contract)
  (var-get oracle-contract)
)

(define-read-only (get-governance-contract)
  (var-get governance-contract)
)

;; Policy read functions
(define-read-only (get-policy (policy-id (string-ascii 20)))
  (map-get? policies { policy-id: policy-id })
)

(define-read-only (get-purchase (purchase-id (string-ascii 36)))
  (map-get? policy-purchases { purchase-id: purchase-id })
)

(define-read-only (get-policy-count)
  (var-get policy-count)
)

(define-read-only (get-purchase-count)
  (var-get purchase-count)
)

(define-read-only (calculate-premium (policy-id (string-ascii 20)) (stx-amount uint))
  (let (
    (policy (unwrap! (get-policy policy-id) (err ERR_POLICY_NOT_FOUND)))
    (premium-rate (get premium-percentage policy))
  )
    (/ (* stx-amount premium-rate) u10000)
  )
)

(define-read-only (calculate-fee (policy-id (string-ascii 20)) (stx-amount uint))
  (let (
    (policy (unwrap! (get-policy policy-id) (err ERR_POLICY_NOT_FOUND)))
    (fee-rate (get protocol-fee policy))
  )
    (/ (* stx-amount fee-rate) u10000)
  )
)

;; Claim read functions
(define-read-only (get-claim (claim-id (string-ascii 36)))
  (map-get? claims { claim-id: claim-id })
)

(define-read-only (get-claim-count)
  (var-get claim-count)
)

(define-read-only (get-auto-approve)
  (var-get auto-approve)
)

;; Treasury read functions
(define-read-only (get-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-total-deposits)
  (var-get total-deposits)
)

(define-read-only (get-total-payouts)
  (var-get total-payouts)
)

(define-read-only (get-reserve-ratio)
  (var-get reserve-ratio)
)

(define-read-only (get-available-funds)
  (let (
    (total-balance (stx-get-balance (as-contract tx-sender)))
    (reserve-amount (/ (* total-balance (var-get reserve-ratio)) u10000))
  )
    (- total-balance reserve-amount)
  )
)

;; Helper function to get attestation from oracle contract
(define-read-only (get-attestation (tx-hash (buff 32)))
  (contract-call? (var-get oracle-contract) get-attestation tx-hash)
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

(define-public (update-policy-status (policy-id (string-ascii 20)) (active bool))
  (begin
    ;; Only admin can update policy status
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    
    ;; Ensure policy exists
    (asserts! (is-some (get-policy policy-id)) (err ERR_POLICY_NOT_FOUND))
    
    ;; Update the policy status
    (match (get-policy policy-id)
      policy
      (map-set policies
        { policy-id: policy-id }
        (merge policy { active: active })
      )
      (err ERR_POLICY_NOT_FOUND)
    )
    
    (ok true)
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

;; Claims processing functions
(define-public (submit-claim 
  (claim-id (string-ascii 36))
  (purchase-id (string-ascii 36))
  (tx-hash (buff 32))
)
  (let (
    (purchase (unwrap! (get-purchase purchase-id) (err ERR_PURCHASE_NOT_FOUND)))
    (policy-id (get policy-id purchase))
    (policy (unwrap! (get-policy policy-id) (err ERR_POLICY_NOT_FOUND)))
    (attestation (unwrap! (get-attestation tx-hash) (err ERR_ATTESTATION_NOT_FOUND)))
    (delay-blocks (get delay-blocks attestation))
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
      (asserts! (>= delay-blocks delay-threshold) (err ERR_INSUFFICIENT_DELAY))
      
      ;; Create the claim
      (map-set claims
        { claim-id: claim-id }
        {
          purchase-id: purchase-id,
          tx-hash: tx-hash,
          claimer: tx-sender,
          broadcast-height: (get broadcast-height attestation),
          inclusion-height: (get inclusion-height attestation),
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
      
      ;; Auto-approve if enabled
      (if (var-get auto-approve)
        (try! (process-claim claim-id CLAIM_STATUS_APPROVED))
        (ok claim-id)
      )
    )
  )
)

(define-public (process-claim (claim-id (string-ascii 36)) (status uint))
  (let (
    (claim (unwrap! (get-claim claim-id) (err ERR_CLAIM_NOT_FOUND)))
  )
    (begin
      ;; Only admin can process claims
      (asserts! (or 
                  (is-eq tx-sender (var-get admin))
                  (and (var-get auto-approve) (is-eq status CLAIM_STATUS_APPROVED))
                ) 
                (err ERR_UNAUTHORIZED))
      
      ;; Ensure claim is pending
      (asserts! (is-eq (get status claim) CLAIM_STATUS_PENDING) (err ERR_ALREADY_CLAIMED))
      
      ;; Validate status
      (asserts! (or 
                  (is-eq status CLAIM_STATUS_APPROVED)
                  (is-eq status CLAIM_STATUS_REJECTED)
                ) 
                (err ERR_INVALID_PARAMETER))
      
      ;; Update claim status
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
      
      ;; Process payout if approved
      (if (is-eq status CLAIM_STATUS_APPROVED)
        (try! (pay-claim claim-id))
        (ok claim-id)
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
      ;; Only admin or this contract can pay claims
      (asserts! (or 
                  (is-eq tx-sender (var-get admin))
                  (is-eq tx-sender (as-contract tx-sender))
                ) 
                (err ERR_UNAUTHORIZED))
      
      ;; Ensure claim is approved
      (asserts! (is-eq (get status claim) CLAIM_STATUS_APPROVED) (err ERR_INVALID_PARAMETER))
      
      ;; Check if treasury has enough funds
      (asserts! (>= (get-available-funds) payout-amount) (err ERR_INSUFFICIENT_FUNDS))
      
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

;; Treasury management functions
(define-public (deposit)
  (let (
    (amount (stx-get-balance tx-sender))
  )
    (begin
      (asserts! (> amount u0) (err ERR_INVALID_PARAMETER))
      (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
      (var-set total-deposits (+ (var-get total-deposits) amount))
      (ok amount)
    )
  )
)

(define-public (deposit-specific (amount uint))
  (begin
    (asserts! (> amount u0) (err ERR_INVALID_PARAMETER))
    (asserts! (>= (stx-get-balance tx-sender) amount) (err ERR_INSUFFICIENT_FUNDS))
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (ok amount)
  )
)

(define-public (withdraw-excess (recipient principal))
  (let (
    (available (get-available-funds))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
      (asserts! (> available u0) (err ERR_INSUFFICIENT_FUNDS))
      (try! (as-contract (stx-transfer? available tx-sender recipient)))
      (ok available)
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

(define-public (set-oracle-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set oracle-contract new-contract)
    (ok true)
  )
)

(define-public (set-governance-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set governance-contract new-contract)
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

(define-public (set-auto-approve (new-value bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set auto-approve new-value)
    (ok true)
  )
)
