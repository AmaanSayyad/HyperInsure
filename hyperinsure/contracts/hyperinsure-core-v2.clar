;; HyperInsure Core V2 - Trustless Bitcoin Verification
;; Uses clarity-bitcoin-lib-v5 directly for trustless verification
;; No oracle dependency - fully decentralized

;; Import clarity-bitcoin library (deployed on mainnet)
;; Contract: SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.clarity-bitcoin-lib-v5

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
(define-constant ERR_BTC_VERIFICATION_FAILED u15)
(define-constant ERR_INSUFFICIENT_DELAY u16)

;; Claim status
(define-constant CLAIM_STATUS_PENDING u1)
(define-constant CLAIM_STATUS_VERIFIED u2)
(define-constant CLAIM_STATUS_APPROVED u3)
(define-constant CLAIM_STATUS_REJECTED u4)
(define-constant CLAIM_STATUS_PAID u5)

;; Data maps
(define-map policies
  { policy-id: (string-ascii 20) }
  {
    name: (string-ascii 100),
    description: (string-utf8 500),
    delay-threshold: uint,
    premium-percentage: uint,
    protocol-fee: uint,
    payout-per-incident: uint,
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
    broadcast-height: uint,
    inclusion-height: uint,
    delay-blocks: uint,
    policy-id: (string-ascii 20),
    payout-amount: uint,
    status: uint,
    created-at: uint,
    verified-at: (optional uint),
    processed-at: (optional uint),
    processed-by: (optional principal)
  }
)

;; Bitcoin verification data
(define-map btc-verifications
  { tx-hash: (buff 32) }
  {
    verified: bool,
    block-height: uint,
    verified-at: uint
  }
)

;; Admin and counters
(define-data-var admin principal tx-sender)
(define-data-var policy-count uint u0)
(define-data-var purchase-count uint u0)
(define-data-var claim-count uint u0)
(define-data-var total-deposits uint u0)
(define-data-var total-payouts uint u0)
(define-data-var reserve-ratio uint u5000)

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

(define-read-only (get-btc-verification (tx-hash (buff 32)))
  (map-get? btc-verifications { tx-hash: tx-hash })
)

(define-read-only (calculate-premium (policy-id (string-ascii 20)) (stx-amount uint))
  (match (get-policy policy-id)
    policy (/ (* stx-amount (get premium-percentage policy)) u10000)
    u0
  )
)

(define-read-only (calculate-fee (policy-id (string-ascii 20)) (stx-amount uint))
  (match (get-policy policy-id)
    policy (/ (* stx-amount (get protocol-fee policy)) u10000)
    u0
  )
)

;; Policy management
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
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (> delay-threshold u0) (err ERR_INVALID_PARAMETER))
    (asserts! (and (> premium-percentage u0) (<= premium-percentage u10000)) (err ERR_INVALID_PARAMETER))
    (asserts! (and (>= protocol-fee u0) (<= protocol-fee u10000)) (err ERR_INVALID_PARAMETER))
    (asserts! (> payout-per-incident u0) (err ERR_INVALID_PARAMETER))
    (asserts! (is-none (get-policy policy-id)) (err ERR_POLICY_EXISTS))
    
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
      (asserts! (is-none (get-purchase purchase-id)) (err ERR_PURCHASE_EXISTS))
      (asserts! (get active policy) (err ERR_POLICY_INACTIVE))
      (asserts! (>= (stx-get-balance tx-sender) total-cost) (err ERR_INSUFFICIENT_FUNDS))
      
      (try! (stx-transfer? total-cost tx-sender (as-contract tx-sender)))
      (var-set total-deposits (+ (var-get total-deposits) total-cost))
      
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
          expiry: (+ stacks-block-height u1008)
        }
      )
      
      (var-set purchase-count (+ (var-get purchase-count) u1))
      (ok purchase-id)
    )
  )
)

;; Trustless Bitcoin verification using clarity-bitcoin-lib-v5
;; This calls the deployed clarity-bitcoin contract on mainnet
(define-public (verify-btc-transaction
  (btc-height uint)
  (tx (buff 1024))
  (header (buff 80))
  (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint })
)
  (let (
    ;; Call clarity-bitcoin-lib-v5 contract
    ;; In production: SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.clarity-bitcoin-lib-v5
    ;; In testing: use local .clarity-bitcoin contract
    (verification-result (contract-call? .clarity-bitcoin was-tx-mined-compact
      btc-height
      tx
      header
      proof
    ))
  )
    (match verification-result
      success
      (begin
        ;; Calculate tx hash for storage
        (let ((tx-hash (unwrap-panic (as-max-len? success u32))))
          (map-set btc-verifications
            { tx-hash: tx-hash }
            {
              verified: true,
              block-height: btc-height,
              verified-at: stacks-block-height
            }
          )
          (ok tx-hash)
        )
      )
      error (err ERR_BTC_VERIFICATION_FAILED)
    )
  )
)

;; Submit claim with Bitcoin proof (trustless)
(define-public (submit-claim-with-proof
  (claim-id (string-ascii 36))
  (purchase-id (string-ascii 36))
  (tx-hash (buff 32))
  (broadcast-height uint)
  (inclusion-height uint)
  (tx (buff 1024))
  (header (buff 80))
  (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint })
)
  (let (
    (purchase (unwrap! (get-purchase purchase-id) (err ERR_PURCHASE_NOT_FOUND)))
    (policy-id (get policy-id purchase))
    (policy (unwrap! (get-policy policy-id) (err ERR_POLICY_NOT_FOUND)))
    (delay-threshold (get delay-threshold policy))
    (delay-blocks (- inclusion-height broadcast-height))
    (payout-amount (get payout-per-incident policy))
  )
    (begin
      ;; Validate claim
      (asserts! (is-none (get-claim claim-id)) (err ERR_CLAIM_EXISTS))
      (asserts! (get active purchase) (err ERR_PURCHASE_INACTIVE))
      (asserts! (<= stacks-block-height (get expiry purchase)) (err ERR_PURCHASE_EXPIRED))
      (asserts! (is-eq tx-sender (get purchaser purchase)) (err ERR_UNAUTHORIZED))
      (asserts! (>= delay-blocks delay-threshold) (err ERR_INSUFFICIENT_DELAY))
      
      ;; Verify Bitcoin transaction using clarity-bitcoin-lib-v5
      (try! (verify-btc-transaction inclusion-height tx header proof))
      
      ;; Create verified claim
      (map-set claims
        { claim-id: claim-id }
        {
          purchase-id: purchase-id,
          tx-hash: tx-hash,
          claimer: tx-sender,
          broadcast-height: broadcast-height,
          inclusion-height: inclusion-height,
          delay-blocks: delay-blocks,
          policy-id: policy-id,
          payout-amount: payout-amount,
          status: CLAIM_STATUS_VERIFIED,
          created-at: stacks-block-height,
          verified-at: (some stacks-block-height),
          processed-at: none,
          processed-by: none
        }
      )
      
      (var-set claim-count (+ (var-get claim-count) u1))
      (ok claim-id)
    )
  )
)

;; Process verified claim (admin only)
(define-public (process-verified-claim (claim-id (string-ascii 36)) (approve bool))
  (let (
    (claim (unwrap! (get-claim claim-id) (err ERR_CLAIM_NOT_FOUND)))
    (payout-amount (get payout-amount claim))
    (recipient (get claimer claim))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
      (asserts! (is-eq (get status claim) CLAIM_STATUS_VERIFIED) (err ERR_ALREADY_CLAIMED))
      
      (if approve
        (begin
          (asserts! (>= (stx-get-balance (as-contract tx-sender)) payout-amount) (err ERR_INSUFFICIENT_FUNDS))
          (try! (as-contract (stx-transfer? payout-amount tx-sender recipient)))
          (var-set total-payouts (+ (var-get total-payouts) payout-amount))
          
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
          (map-set claims
            { claim-id: claim-id }
            (merge claim 
              { 
                status: CLAIM_STATUS_REJECTED,
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

;; Admin functions
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set admin new-admin)
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

(define-public (fund-contract (amount uint))
  (begin
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (ok true)
  )
)

(define-public (update-policy-status (policy-id (string-ascii 20)) (active bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (is-some (get-policy policy-id)) (err ERR_POLICY_NOT_FOUND))
    
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
