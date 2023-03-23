// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract NFTMarketplaceV2 is
    ERC721Holder,
    ERC1155Holder,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /**
     * `seller` is the seller of the nft
     * `price` is the selling price of nft
     * `tokenTypes` types :
     *      1. ERC721 = 1
     *      2. ERC1155 = 2
     * Here `sold` specifies that item is sold or not
     * Here `status` specifies that item is listed or not
     */
    struct Listing {
        address seller;
        uint256 price;
        uint8 tokenType;
        uint256 tokenAmount;
        bool status;
        bool sold;
    }

    // listing counting
    uint256 public listingCount;

    // reentracy
    bool functionInUsed;

    // mapping from contractaddress to tokenId to tokenlistingDetails
    mapping(address => mapping(uint256 => Listing)) public listings;

    modifier reEntrancyGuard() {
        require(!functionInUsed,"reentracy guard : function already in used");
        functionInUsed = true;
        _;
        functionInUsed = false;
    }

    event ListingCreated(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 price,
        address indexed seller,
        uint8 tokenType,
        uint256 tokenAmount
    );
    event ListingRemoved(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint8 indexed tokenType,
        uint256 tokenAmount
    );
    event ListingSold(
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        address indexed buyer,
        address indexed seller,
        uint8 tokenType,
        uint256 tokenAmount
    );
    event ListingPausedUnpaused(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint8 tokenType,
        address indexed owner,
        bool status
    );
    event ListingUpdated(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 newPrice
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    function version() external pure returns(string memory){
        return "V2";
    }

    /**
     * @dev this is function is use to list nft
     * @param nftContract address of contract
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint8 tokenType,
        uint256 tokenAmount
    ) external reEntrancyGuard returns(bool){
        require(price > 0, "Price must be greater than zero");
        require(tokenType == 1 || tokenType == 2, "Invalid token type");
        require(tokenAmount > 0, "Invalid token amount");
        require(
            !listings[nftContract][tokenId].status,
            "NFT is already listed"
        );

        if (tokenType == 1) {
            require(
                tokenAmount == 1,
                "token amount 1 expect for erc721 token"
            );
            IERC721 nft = IERC721(nftContract);
            require(
                nft.ownerOf(tokenId) == msg.sender,
                "Only the owner can list the NFT"
            );
            require(
                nft.getApproved(tokenId) == address(this),
                "Need to approve this contract"
            );

            nft.safeTransferFrom(msg.sender, address(this), tokenId);
        } else {
            IERC1155 nft = IERC1155(nftContract);
            require(
                nft.balanceOf(msg.sender, tokenId) >= tokenAmount,
                "Sender does have sufficient amount of token"
            );

            require(
                nft.isApprovedForAll(msg.sender,address(this)),
                "Sender need to approve this contract"
            );


            nft.safeTransferFrom(
                msg.sender,
                address(this),
                tokenId,
                tokenAmount,
                ""
            );
        }
        listings[nftContract][tokenId] = Listing(
            msg.sender,
            price,
            tokenType,
            tokenAmount,
            true,
            false
        );

        listingCount++;

        emit ListingCreated(
            nftContract,
            tokenId,
            price,
            msg.sender,
            tokenType,
            tokenAmount
        );

        return true;
    }

    /**
     *
     */
    function removeListing(address nftContract, uint256 tokenId) external reEntrancyGuard returns(bool){
        Listing storage listing = listings[nftContract][tokenId];

        require(listing.seller != address(0), "No such listing");
        require(
            listing.seller == msg.sender,
            "Only the seller can remove the listing"
        );
        require(!listing.sold, "Nft already sold");

        if (listing.tokenType == 1) {
            IERC721(nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId
            );
        } else {
            IERC1155(nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                listing.tokenAmount,
                ""
            );
        }

        delete listings[nftContract][tokenId];

        listingCount--;

        emit ListingRemoved(
            nftContract,
            tokenId,
            listing.tokenType,
            listing.tokenAmount
        );

        return true;
    }

    // need to add pausable feature
    function pauseUnpauseListing(
        address nftContract,
        uint256 tokenId,
        bool newStatus
    ) external returns (bool) {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.seller != address(0),"Invalid input, no such listing");
        require(!listing.sold, "Nft already sold");
        require(
            listing.seller == msg.sender,
            "Only owner can pause the listing"
        );

        listing.status = newStatus; // updating status

        emit ListingPausedUnpaused(
            nftContract,
            tokenId,
            listing.tokenType,
            msg.sender,
            newStatus
        );

        return true;
    }

    // need to add buy feature
    function buyListedNft(
        address nftContract,
        uint256 tokenId
    ) external reEntrancyGuard payable returns (bool) {
        Listing storage listing = listings[nftContract][tokenId];

        require(listing.seller != address(0),"No such listing");
        require(listing.status, "listing is paused");
        require(!listing.sold, "Nft already sold");
        require(listing.price <= msg.value, "Insufficient amount sended");

        if (listing.tokenType == 1) {
            IERC721(nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId
            );
        } else {
            IERC1155(nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                listing.tokenAmount,
                ""
            );
        }

        listing.sold = true;
        listing.status = false;

        (bool sent,) = payable(listing.seller).call{value: msg.value}("");

        require(sent,"eth transfer failed");

        listingCount--;

        emit ListingSold(
            nftContract,
            tokenId,
            listing.price,
            msg.sender,
            listing.seller,
            listing.tokenType,
            listing.tokenAmount
        );

        return true;
    }

    function updateListing(
        address nftContract,
        uint256 tokenId,
        uint256 newAmount
    ) external returns (bool) {
        Listing storage listing = listings[nftContract][tokenId];

        require(!listing.sold, "Nft already sold");
        require(
            listing.seller == msg.sender,
            "Only owner can update listing details"
        );
        require(newAmount > 0, "Amount should be greater than zero");

        listing.price = newAmount;

        emit ListingUpdated(nftContract, tokenId, newAmount);

        return true;
    }
}
