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

    string private _version;

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
     * @param _nftContract address of contract
     */
    function createListing(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price,
        uint8 _tokenType,
        uint256 _tokenAmount
    ) external reEntrancyGuard returns(bool){
        require(_price > 0, "Price must be greater than zero");
        require(_tokenType == 1 || _tokenType == 2, "Invalid token type");
        require(_tokenAmount > 0, "Invalid token amount");
        require(
            listings[_nftContract][_tokenId].status == false,
            "NFT is already listed"
        );

        if (_tokenType == 1) {
            require(
                _tokenAmount == 1,
                "token amount 1 expect for erc721 token"
            );
            IERC721 nft = IERC721(_nftContract);
            require(
                nft.ownerOf(_tokenId) == msg.sender,
                "Only the owner can list the NFT"
            );
            require(
                nft.getApproved(_tokenId) == address(this),
                "Need to approve this contract"
            );

            nft.safeTransferFrom(msg.sender, address(this), _tokenId);
        } else {
            IERC1155 nft = IERC1155(_nftContract);
            require(
                nft.balanceOf(msg.sender, _tokenId) >= _tokenAmount,
                "Sender does have sufficient amount of token"
            );

            require(
                nft.isApprovedForAll(msg.sender,address(this)),
                "Sender need to approve this contract"
            );


            nft.safeTransferFrom(
                msg.sender,
                address(this),
                _tokenId,
                _tokenAmount,
                ""
            );
        }
        listings[_nftContract][_tokenId] = Listing(
            msg.sender,
            _price,
            _tokenType,
            _tokenAmount,
            true,
            false
        );

        listingCount++;

        emit ListingCreated(
            _nftContract,
            _tokenId,
            _price,
            msg.sender,
            _tokenType,
            _tokenAmount
        );

        return true;
    }

    /**
     *
     */
    function removeListing(address _nftContract, uint256 _tokenId) external reEntrancyGuard returns(bool){
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.seller != address(0), "No such listing");
        require(
            listing.seller == msg.sender,
            "Only the seller can remove the listing"
        );
        require(listing.sold == false, "Nft already sold");

        if (listing.tokenType == 1) {
            IERC721(_nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                _tokenId
            );
        } else {
            IERC1155(_nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                _tokenId,
                listing.tokenAmount,
                ""
            );
        }

        delete listings[_nftContract][_tokenId];

        listingCount--;

        emit ListingRemoved(
            _nftContract,
            _tokenId,
            listing.tokenType,
            listing.tokenAmount
        );

        return true;
    }

    // need to add pausable feature
    function pauseUnpauseListing(
        address _nftContract,
        uint256 _tokenId,
        bool newStatus
    ) external returns (bool) {
        Listing storage listing = listings[_nftContract][_tokenId];
        require(listing.seller != address(0),"Invalid input, no such listing");
        require(listing.sold == false, "Nft already sold");
        require(
            listing.seller == msg.sender,
            "Only owner can pause the listing"
        );

        listing.status = newStatus; // updating status

        emit ListingPausedUnpaused(
            _nftContract,
            _tokenId,
            listing.tokenType,
            msg.sender,
            newStatus
        );

        return true;
    }

    // need to add buy feature
    function buyListedNft(
        address _nftContract,
        uint256 _tokenId
    ) external reEntrancyGuard payable returns (bool) {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.seller != address(0),"No such listing");
        require(listing.status == true, "listing is paused");
        require(listing.sold == false, "Nft already sold");
        require(listing.price <= msg.value, "Insufficient amount sended");

        if (listing.tokenType == 1) {
            IERC721(_nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                _tokenId
            );
        } else {
            IERC1155(_nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                _tokenId,
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
            _nftContract,
            _tokenId,
            listing.price,
            msg.sender,
            listing.seller,
            listing.tokenType,
            listing.tokenAmount
        );

        return true;
    }

    function updateListing(
        address _nftContract,
        uint256 _tokenId,
        uint256 _newAmount
    ) external returns (bool) {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.sold == false, "Nft already sold");
        require(
            listing.seller == msg.sender,
            "Only owner can update listing details"
        );
        require(_newAmount > 0, "Amount should be greater than zero");

        listing.price = _newAmount;

        emit ListingUpdated(_nftContract, _tokenId, _newAmount);

        return true;
    }
}
