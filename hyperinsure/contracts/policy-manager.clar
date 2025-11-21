;; Policy Manager Contract
;; Handles insurance policy creation and management
;; This contract is part of the insurance claim verification system

;; Error codes - using centralized error codes
(define-constant ERR_POLICY_NOT_FOUND (err u11))
(define-constant ERR_POLICY_EXPIRED (err u12))
(define-constant ERR_UNAUTHORIZED (err u6))
(define-constant ERR_INVALID_AMOUNT (err u7))
(define-constant ERR_INVALID_COVERAGE (err u55))
(define-constant ERR_INVALID_PREMIUM (err u56))
(define-constant ERR_INVALID_DURATION (err u54))
(define-constant ERR_TRANSFER_FAILED (err u62))

;; Data variables
(define-data-var policy-counter uint u0)
(define-data-var contract-owner principal tx-sender)

;; Policy data structure
(define-map policies uint {
  holder: principal,
  coverage-amount: uint,
  premium-paid: uint,
  start-block: uint,
  end-block: uint,
  status: (string-ascii 20)
})

;; Validation functions
(define-private (validate-policy-params (coverage-amount uint) (premium uint) (duration uint))
  (and
    (and (> coverage-amount u0) (<= coverage-amount u100000000000))
    (and (> premium u0) (<= premium coverage-amount) (>= premium (/ coverage-amount u1000)))
    (and (> duration u0) (<= duration u1051200))
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
(define-read-only (get-policy (policy-id uint))
  (map-get? policies policy-id)
)

(define-read-only (is-policy-active (policy-id uint))
  (match (get-policy policy-id)
    policy (and 
      (is-eq (get status policy) "active")
      (< stacks-block-height (get end-block policy)))
    false
  )
)

(define-read-only (is-policy-expired (policy-id uint))
  (match (get-policy policy-id)
    policy (>= stacks-block-height (get end-block policy))
    true ;; Non-existent policies are considered expired
  )
)

(define-read-only (get-policy-holder (policy-id uint))
  (match (get-policy policy-id)
    policy (some (get holder policy))
    none
  )
)

(define-read-only (is-policy-holder (policy-id uint) (user principal))
  (match (get-policy policy-id)
    policy (is-eq (get holder policy) user)
    false
  )
)

(define-read-only (get-policy-counter)
  (var-get policy-counter)
)

;; Public functions
(define-public (purchase-policy (coverage-amount uint) (premium uint) (duration uint))
  (let (
    (new-policy-id (+ (var-get policy-counter) u1))
    (end-block (+ stacks-block-height duration))
  )
    ;; Validate policy parameters
    (asserts! (validate-policy-params coverage-amount premium duration) ERR_INVALID_AMOUNT)
    
    ;; Transfer premium to this contract first
    (match (stx-transfer? premium tx-sender (as-contract tx-sender))
      success
      (begin
        ;; Increment policy counter
        (var-set policy-counter new-policy-id)
        
        ;; Create policy record
        (map-set policies new-policy-id {
          holder: tx-sender,
          coverage-amount: coverage-amount,
          premium-paid: premium,
          start-block: stacks-block-height,
          end-block: end-block,
          status: "active"
        })
        
        ;; Transfer premium to treasury and notify treasury
        (match (as-contract (stx-transfer? premium (as-contract tx-sender) .insurance-treasury-v2))
          treasury-success
          (begin
            ;; Notify treasury of premium receipt
            (try! (contract-call? .insurance-treasury-v2 receive-premium new-policy-id premium tx-sender))
            
            ;; Emit policy creation event
            (print {
              event: "policy-created",
              policy-id: new-policy-id,
              holder: tx-sender,
              coverage-amount: coverage-amount,
              premium-paid: premium,
              duration: duration,
              treasury-funded: true
            })
            
            (ok new-policy-id)
          )
          treasury-error
          (begin
            ;; Log treasury transfer failure
            (log-error "purchase-policy-treasury-transfer" u62)
            ERR_TRANSFER_FAILED
          )
        )
      )
      error
      (begin
        ;; Log transfer failure
        (log-error "purchase-policy" u62)
        ERR_TRANSFER_FAILED
      )
    )
  )
)

;; Administrative functions
(define-public (set-policy-status (policy-id uint) (new-status (string-ascii 20)))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (let ((policy (unwrap! (get-policy policy-id) ERR_POLICY_NOT_FOUND)))
      (map-set policies policy-id 
        (merge policy { status: new-status }))
      (ok true)
    )
  )
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set contract-owner new-owner)
    (ok true)
  )
)