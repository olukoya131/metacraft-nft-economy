;; MetaCraft Gaming Economy Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-item-exists (err u102))
(define-constant err-invalid-price (err u103))

;; Define NFT token
(define-non-fungible-token metacraft-nft uint)

;; Define fungible token for in-game currency
(define-fungible-token metacoin)

;; Data structures
(define-map token-metadata
    uint
    {
        name: (string-ascii 64),
        description: (string-ascii 256),
        image-uri: (string-ascii 256),
        properties: (list 10 (string-ascii 64))
    }
)

(define-map token-owners
    uint 
    principal
)

(define-map token-prices
    uint
    uint
)

(define-data-var last-token-id uint u0)

;; NFT Management Functions
(define-public (mint-nft (name (string-ascii 64)) 
                        (description (string-ascii 256))
                        (image-uri (string-ascii 256))
                        (properties (list 10 (string-ascii 64)))
                        (price uint))
    (let
        (
            (token-id (+ (var-get last-token-id) u1))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (try! (nft-mint? metacraft-nft token-id tx-sender))
        (map-set token-metadata token-id
            {
                name: name,
                description: description,
                image-uri: image-uri,
                properties: properties
            }
        )
        (map-set token-owners token-id tx-sender)
        (map-set token-prices token-id price)
        (var-set last-token-id token-id)
        (ok token-id)
    )
)

(define-public (transfer-nft (token-id uint) (recipient principal))
    (let
        (
            (owner (unwrap! (map-get? token-owners token-id) err-not-token-owner))
        )
        (asserts! (is-eq tx-sender owner) err-not-token-owner)
        (try! (nft-transfer? metacraft-nft token-id tx-sender recipient))
        (map-set token-owners token-id recipient)
        (ok true)
    )
)

(define-public (buy-nft (token-id uint))
    (let
        (
            (price (unwrap! (map-get? token-prices token-id) err-invalid-price))
            (owner (unwrap! (map-get? token-owners token-id) err-not-token-owner))
        )
        (try! (ft-transfer? metacoin price tx-sender owner))
        (try! (nft-transfer? metacraft-nft token-id owner tx-sender))
        (map-set token-owners token-id tx-sender)
        (ok true)
    )
)

;; Read-only functions
(define-read-only (get-token-metadata (token-id uint))
    (map-get? token-metadata token-id)
)

(define-read-only (get-token-owner (token-id uint))
    (map-get? token-owners token-id)
)

(define-read-only (get-token-price (token-id uint))
    (map-get? token-prices token-id)
)

(define-read-only (get-balance (account principal))
    (ok (ft-get-balance metacoin account))
)