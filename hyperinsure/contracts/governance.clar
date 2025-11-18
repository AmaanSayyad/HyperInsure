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

;; Proposal constants
(define-constant PROPOSAL_TYPE_PARAMETER u1)
(define-constant PROPOSAL_TYPE_CONTRACT_UPGRADE u2)
(define-constant PROPOSAL_TYPE_ADMIN_CHANGE u3)

(define-constant VOTE_FOR u1)
(define-constant VOTE_AGAINST u2)

(define-constant ERR_PROPOSAL_EXISTS u3)
(define-constant ERR_PROPOSAL_NOT_FOUND u4)
(define-constant ERR_ALREADY_VOTED u5)
(define-constant ERR_VOTING_CLOSED u6)
(define-constant ERR_PROPOSAL_NOT_ACTIVE u7)

(define-map proposals
  { proposal-id: uint }
  {
    title: (string-ascii 100),
    description: (string-utf8 500),
    proposal-type: uint,
    param-name: (optional (string-ascii 50)),
    param-value: (optional uint),
    proposer: principal,
    created-at: uint,
    voting-ends-at: uint,
    executed: bool,
    votes-for: uint,
    votes-against: uint,
    active: bool
  }
)

(define-map votes
  { proposal-id: uint, voter: principal }
  {
    vote-type: uint,
    vote-weight: uint,
    voted-at: uint
  }
)

(define-data-var proposal-count uint u0)
(define-data-var voting-period uint u1008)
(define-data-var min-votes-required uint u10)
(define-data-var min-approval-percentage uint u6000)

(define-read-only (get-proposal-count)
  (var-get proposal-count)
)

(define-read-only (get-voting-period)
  (var-get voting-period)
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-public (create-proposal 
  (title (string-ascii 100))
  (description (string-utf8 500))
  (proposal-type uint)
  (param-name (optional (string-ascii 50)))
  (param-value (optional uint))
  (contract-address (optional principal))
  (target-address (optional principal))
)
  (let (
    (proposal-id (var-get proposal-count))
    (voting-ends (+ stacks-block-height (var-get voting-period)))
  )
    (begin
      ;; Validate proposal type
      (asserts! (or 
                  (is-eq proposal-type PROPOSAL_TYPE_PARAMETER)
                  (is-eq proposal-type PROPOSAL_TYPE_CONTRACT_UPGRADE)
                  (is-eq proposal-type PROPOSAL_TYPE_ADMIN_CHANGE)
                ) 
                (err ERR_INVALID_PARAMETER))
      
      ;; Create the proposal
      (map-set proposals
        { proposal-id: proposal-id }
        {
          title: title,
          description: description,
          proposal-type: proposal-type,
          param-name: param-name,
          param-value: param-value,
          proposer: tx-sender,
          created-at: stacks-block-height,
          voting-ends-at: voting-ends,
          executed: false,
          votes-for: u0,
          votes-against: u0,
          active: true
        }
      )
      
      ;; Increment proposal count
      (var-set proposal-count (+ (var-get proposal-count) u1))
      
      (ok proposal-id)
    )
  )
)

(define-public (vote (proposal-id uint) (vote-type uint))
  (let (
    (proposal (unwrap! (get-proposal proposal-id) (err ERR_PROPOSAL_NOT_FOUND)))
    (vote-weight u1)
  )
    (begin
      ;; Ensure proposal is active and voting is still open
      (asserts! (get active proposal) (err ERR_PROPOSAL_NOT_ACTIVE))
      (asserts! (<= stacks-block-height (get voting-ends-at proposal)) (err ERR_VOTING_CLOSED))
      
      ;; Ensure user hasn't already voted
      (asserts! (is-none (get-vote proposal-id tx-sender)) (err ERR_ALREADY_VOTED))
      
      ;; Validate vote type
      (asserts! (or (is-eq vote-type VOTE_FOR) (is-eq vote-type VOTE_AGAINST)) (err ERR_INVALID_PARAMETER))
      
      ;; Record the vote
      (map-set votes
        { proposal-id: proposal-id, voter: tx-sender }
        {
          vote-type: vote-type,
          vote-weight: vote-weight,
          voted-at: stacks-block-height
        }
      )
      
      ;; Update proposal vote counts
      (if (is-eq vote-type VOTE_FOR)
        (map-set proposals
          { proposal-id: proposal-id }
          (merge proposal { votes-for: (+ (get votes-for proposal) vote-weight) })
        )
        (map-set proposals
          { proposal-id: proposal-id }
          (merge proposal { votes-against: (+ (get votes-against proposal) vote-weight) })
        )
      )
      
      (ok vote-weight)
    )
  )
)

(define-public (cancel-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (get-proposal proposal-id) (err ERR_PROPOSAL_NOT_FOUND)))
  )
    (begin
      ;; Only the proposer or admin can cancel a proposal
      (asserts! (or 
                  (is-eq tx-sender (get proposer proposal))
                  (is-eq tx-sender (var-get admin))
                ) 
                (err ERR_UNAUTHORIZED))
      
      ;; Ensure proposal is active and not executed
      (asserts! (get active proposal) (err ERR_PROPOSAL_NOT_ACTIVE))
      (asserts! (not (get executed proposal)) (err ERR_PROPOSAL_NOT_ACTIVE))
      
      ;; Mark proposal as inactive
      (map-set proposals
        { proposal-id: proposal-id }
        (merge proposal { active: false })
      )
      
      (ok true)
    )
  )
)

(define-public (set-voting-period (new-period uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (> new-period u0) (err ERR_INVALID_PARAMETER))
    (var-set voting-period new-period)
    (ok true)
  )
)

(define-public (set-min-votes-required (new-min uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (> new-min u0) (err ERR_INVALID_PARAMETER))
    (var-set min-votes-required new-min)
    (ok true)
  )
)

(define-public (set-min-approval-percentage (new-percentage uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (and (> new-percentage u0) (<= new-percentage u10000)) (err ERR_INVALID_PARAMETER))
    (var-set min-approval-percentage new-percentage)
    (ok true)
  )
)
