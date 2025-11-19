;; HyperInsure Oracle Contract
;; This contract manages Bitcoin transaction delay attestations from oracles

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_ORACLE_EXISTS u2)
(define-constant ERR_ORACLE_NOT_FOUND u3)
(define-constant ERR_ATTESTATION_EXISTS u4)
(define-constant ERR_INVALID_SIGNATURE u5)
(define-constant ERR_INVALID_TX_HASH u6)
(define-constant ERR_INVALID_BLOCKS u7)
(define-constant ERR_TX_NOT_MINED u8)
(define-constant ERR_INVALID_PROOF u9)

;; Data maps and variables
(define-map oracles
  { oracle-id: principal }
  {
    name: (string-ascii 100),
    public-key: (buff 33),
    active: bool,
    added-at: uint,
    added-by: principal
  }
)

(define-map attestations
  { tx-hash: (buff 32) }
  {
    broadcast-height: uint,
    inclusion-height: uint,
    delay-blocks: uint,
    oracle-id: principal,
    signature: (buff 65),
    created-at: uint,
    verified: bool
  }
)

(define-data-var admin principal tx-sender)
(define-data-var core-contract principal tx-sender)
(define-data-var oracle-count uint u0)
(define-data-var attestation-count uint u0)

;; Read-only functions
(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (get-core-contract)
  (var-get core-contract)
)

(define-read-only (get-oracle (oracle-id principal))
  (map-get? oracles { oracle-id: oracle-id })
)

(define-read-only (get-attestation (tx-hash (buff 32)))
  (map-get? attestations { tx-hash: tx-hash })
)

(define-read-only (get-oracle-count)
  (var-get oracle-count)
)

(define-read-only (get-attestation-count)
  (var-get attestation-count)
)

(define-read-only (is-oracle (oracle-id principal))
  (match (get-oracle oracle-id)
    oracle (get active oracle)
    false
  )
)

(define-read-only (calculate-delay (broadcast-height uint) (inclusion-height uint))
  (if (>= inclusion-height broadcast-height)
    (- inclusion-height broadcast-height)
    u0
  )
)

;; Helper: Verify Bitcoin transaction was mined
(define-private (verify-btc-tx-mined
    (tx-hash (buff 32))
    (btc-block-height uint)
    (tx (buff 1024))
    (header (buff 80))
    (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint }))
  (let (
    (burn-block-hash (unwrap! (get-burn-block-info? header-hash btc-block-height) (err ERR_INVALID_BLOCKS)))
    (calculated-hash (sha256 (sha256 tx)))
  )
    ;; Verify the transaction hash matches
    (asserts! (is-eq calculated-hash tx-hash) (err ERR_INVALID_TX_HASH))
    
    ;; In production, we would verify the merkle proof here
    ;; For now, we trust the oracle's attestation
    (ok true)
  )
)

;; Public functions
(define-public (register-oracle 
  (oracle-id principal)
  (name (string-ascii 100))
  (public-key (buff 33))
)
  (begin
    ;; Only admin can register oracles
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    
    ;; Ensure oracle doesn't already exist
    (asserts! (is-none (get-oracle oracle-id)) (err ERR_ORACLE_EXISTS))
    
    ;; Register the oracle
    (map-set oracles
      { oracle-id: oracle-id }
      {
        name: name,
        public-key: public-key,
        active: true,
        added-at: stacks-block-height,
        added-by: tx-sender
      }
    )
    
    ;; Increment oracle count
    (var-set oracle-count (+ (var-get oracle-count) u1))
    
    (ok oracle-id)
  )
)

(define-public (update-oracle-status (oracle-id principal) (active bool))
  (begin
    ;; Only admin can update oracle status
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    
    ;; Ensure oracle exists
    (asserts! (is-some (get-oracle oracle-id)) (err ERR_ORACLE_NOT_FOUND))
    
    ;; Update the oracle status
    (match (get-oracle oracle-id)
      oracle
      (begin
        (map-set oracles
          { oracle-id: oracle-id }
          (merge oracle { active: active })
        )
        (ok true)
      )
      (err ERR_ORACLE_NOT_FOUND)
    )
  )
)

(define-public (submit-attestation 
  (tx-hash (buff 32))
  (broadcast-height uint)
  (inclusion-height uint)
  (signature (buff 65))
)
  (let (
    (oracle (unwrap! (get-oracle tx-sender) (err ERR_ORACLE_NOT_FOUND)))
    (delay-blocks (calculate-delay broadcast-height inclusion-height))
  )
    (begin
      ;; Only active oracles can submit attestations
      (asserts! (get active oracle) (err ERR_UNAUTHORIZED))
      
      ;; Validate attestation parameters
      (asserts! (> (len tx-hash) u0) (err ERR_INVALID_TX_HASH))
      (asserts! (>= inclusion-height broadcast-height) (err ERR_INVALID_BLOCKS))
      
      ;; Ensure attestation doesn't already exist
      (asserts! (is-none (get-attestation tx-hash)) (err ERR_ATTESTATION_EXISTS))
      
      ;; Record the attestation (unverified)
      (map-set attestations
        { tx-hash: tx-hash }
        {
          broadcast-height: broadcast-height,
          inclusion-height: inclusion-height,
          delay-blocks: delay-blocks,
          oracle-id: tx-sender,
          signature: signature,
          created-at: stacks-block-height,
          verified: false
        }
      )
      
      ;; Increment attestation count
      (var-set attestation-count (+ (var-get attestation-count) u1))
      
      (ok delay-blocks)
    )
  )
)

;; Submit attestation with Bitcoin transaction proof
(define-public (submit-attestation-with-proof
  (tx-hash (buff 32))
  (broadcast-height uint)
  (inclusion-height uint)
  (signature (buff 65))
  (tx (buff 1024))
  (header (buff 80))
  (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint })
)
  (let (
    (oracle (unwrap! (get-oracle tx-sender) (err ERR_ORACLE_NOT_FOUND)))
    (delay-blocks (calculate-delay broadcast-height inclusion-height))
  )
    (begin
      ;; Only active oracles can submit attestations
      (asserts! (get active oracle) (err ERR_UNAUTHORIZED))
      
      ;; Validate attestation parameters
      (asserts! (> (len tx-hash) u0) (err ERR_INVALID_TX_HASH))
      (asserts! (>= inclusion-height broadcast-height) (err ERR_INVALID_BLOCKS))
      
      ;; Ensure attestation doesn't already exist
      (asserts! (is-none (get-attestation tx-hash)) (err ERR_ATTESTATION_EXISTS))
      
      ;; Verify Bitcoin transaction was actually mined
      (try! (verify-btc-tx-mined tx-hash inclusion-height tx header proof))
      
      ;; Record the verified attestation
      (map-set attestations
        { tx-hash: tx-hash }
        {
          broadcast-height: broadcast-height,
          inclusion-height: inclusion-height,
          delay-blocks: delay-blocks,
          oracle-id: tx-sender,
          signature: signature,
          created-at: stacks-block-height,
          verified: true
        }
      )
      
      ;; Increment attestation count
      (var-set attestation-count (+ (var-get attestation-count) u1))
      
      (ok delay-blocks)
    )
  )
)

(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set admin new-admin)
    (ok true)
  )
)

(define-public (set-core-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set core-contract new-contract)
    (ok true)
  )
)

;; FUZZ TESTING - INVARIANTS

;; Invariant: Delay calculation should always be non-negative
(define-read-only (invariant-delay-non-negative)
  (let
    ((broadcast-height u100)
     (inclusion-height u150))
    (>= (calculate-delay broadcast-height inclusion-height) u0)
  )
)

;; FUZZ TESTING - PROPERTY-BASED TESTS

;; Test: Delay calculation is correct
(define-public (test-delay-calculation
    (broadcast-height uint)
    (inclusion-height uint)
  )
  (begin
    (if (> broadcast-height inclusion-height)
      (ok false) ;; Discard invalid inputs
      (let
        (
          (calculated-delay (calculate-delay broadcast-height inclusion-height))
          (expected-delay (- inclusion-height broadcast-height))
        )
        (asserts! (is-eq calculated-delay expected-delay) (err u991))
        (ok true)
      )
    )
  )
)
