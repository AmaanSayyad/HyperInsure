;; Clarity Bitcoin Library
;; Simplified version for Bitcoin transaction verification

;; Verify that a Bitcoin transaction was mined in a specific block
(define-read-only (was-tx-mined-compact
    (height uint)
    (tx (buff 1024))
    (header (buff 80))
    (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint }))
  (let (
    (tx-hash (sha256 (sha256 tx)))
    (merkle-root (get-merkle-root tx-hash proof))
    (header-merkle-root (get-header-merkle-root header))
  )
    (if (is-eq merkle-root header-merkle-root)
      (ok tx-hash)
      (err u1)
    )
  )
)

;; Calculate merkle root from transaction hash and proof
(define-private (get-merkle-root 
    (tx-hash (buff 32))
    (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint }))
  (let (
    (hashes (get hashes proof))
    (tx-index (get tx-index proof))
    (result (fold merkle-step hashes { hash: tx-hash, index: tx-index }))
  )
    (get hash result)
  )
)

;; Merkle tree step function
(define-private (merkle-step 
    (sibling-hash (buff 32))
    (state { hash: (buff 32), index: uint }))
  (let (
    (current-hash (get hash state))
    (current-index (get index state))
    (is-right (is-eq (mod current-index u2) u1))
  )
    {
      hash: (if is-right
        (sha256 (sha256 (concat sibling-hash current-hash)))
        (sha256 (sha256 (concat current-hash sibling-hash)))
      ),
      index: (/ current-index u2)
    }
  )
)

;; Extract merkle root from Bitcoin block header
(define-private (get-header-merkle-root (header (buff 80)))
  (unwrap-panic (as-max-len? (unwrap-panic (slice? header u36 u68)) u32))
)

;; Verify segwit transaction
(define-read-only (was-segwit-tx-mined-compact
    (height uint)
    (tx (buff 1024))
    (header (buff 80))
    (proof { tx-index: uint, hashes: (list 14 (buff 32)), tree-depth: uint })
    (witness-data (buff 4096)))
  (let (
    (wtx-hash (sha256 (sha256 (concat tx witness-data))))
    (merkle-root (get-merkle-root wtx-hash proof))
    (header-merkle-root (get-header-merkle-root header))
  )
    (if (is-eq merkle-root header-merkle-root)
      (ok wtx-hash)
      (err u1)
    )
  )
)
