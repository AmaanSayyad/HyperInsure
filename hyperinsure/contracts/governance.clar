;; HyperInsure Governance Contract - Simplified
;; This contract manages basic protocol parameters

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_INVALID_PARAMETER u2)

;; Data maps and variables
(define-map protocol-parameters
  { param-name: (string-ascii 50) }
  {
    param-value: uint,
    description: (string-utf8 200),
    last-updated: uint,
    updated-by: principal
  }
)

(define-data-var admin principal tx-sender)

;; Initialize default parameters
(map-set protocol-parameters 
  { param-name: "default-delay-threshold" } 
  {
    param-value: u35,
    description: u"Default number of blocks before a transaction is considered delayed",
    last-updated: stacks-block-height,
    updated-by: tx-sender
  }
)

(map-set protocol-parameters 
  { param-name: "default-premium-percentage" } 
  {
    param-value: u200, ;; 2% in basis points
    description: u"Default premium percentage for insurance policies",
    last-updated: stacks-block-height,
    updated-by: tx-sender
  }
)

(map-set protocol-parameters 
  { param-name: "default-protocol-fee" } 
  {
    param-value: u100, ;; 1% in basis points
    description: u"Default protocol fee percentage for insurance policies",
    last-updated: stacks-block-height,
    updated-by: tx-sender
  }
)

;; Read-only functions
(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (get-parameter (param-name (string-ascii 50)))
  (map-get? protocol-parameters { param-name: param-name })
)

(define-read-only (get-parameter-value (param-name (string-ascii 50)))
  (match (get-parameter param-name)
    param (get param-value param)
    u0
  )
)

;; Public functions
(define-public (set-parameter (param-name (string-ascii 50)) (param-value uint) (description (string-utf8 200)))
  (begin
    ;; Only admin can set parameters
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    
    ;; Validate parameter value
    (asserts! (> param-value u0) (err ERR_INVALID_PARAMETER))
    
    ;; Update the parameter
    (map-set protocol-parameters
      { param-name: param-name }
      {
        param-value: param-value,
        description: description,
        last-updated: stacks-block-height,
        updated-by: tx-sender
      }
    )
    
    (ok param-value)
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