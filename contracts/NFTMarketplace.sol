// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0; 
/** Need to implement
 * - Users can list their NFTs for sale (Should accept both ERC721 and ERC1155 tokens)
 * - Others can buy listed NFTs (By paying in terms of ETHERS/MATIC)
 * - User can update the listed NFT's properties (Ex: price)
 * - User can de-list their NFTs from marketplace 
 */

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract NFTMarketplace is ERC721Holder, ERC1155Holder {

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
    
    // mapping from contractaddress to tokenId to tokenlistingDetails
    mapping(address => mapping(uint256 => Listing)) public listings;
    // mapping shows the supporting smart contracts
    mapping(address => bool) public supportedNFTContracts;

    event ListingCreated(address indexed nftContract, uint256 indexed tokenId, uint256 price, address indexed seller, uint8 tokenType, uint256 tokenAmount);
    event ListingRemoved(address indexed nftContract, uint256 indexed tokenId, uint8 indexed tokenType, uint256 tokenAmount);
    event ListingSold(address indexed nftContract, uint256 tokenId, uint256 price, address indexed buyer, address indexed seller, uint8 tokenType, uint256 tokenAmount);
    event ListingPausedUnpaused(address indexed nftContract, uint256 indexed tokenId, uint8 tokenType, address indexed owner);
    event ListingUpdated(address indexed nftContract, uint256 indexed tokenId, uint256 newPrice);

    /**
     * @dev this is function is use to list nft
     * @param _nftContract address of contract
     * @param _tokenId tokenid of the nft token
     * @param _price price of token to sell at
     * @param _tokenType token type can be either erc721(1) or erc1155(2)
     * @param _tokenAmount token amount to list. For erc721 it will be 1.
     * @return boolean value that the tranasaction is succeded or not
     */
    function createListing(address _nftContract, uint256 _tokenId, uint256 _price, uint8 _tokenType, uint256 _tokenAmount) external returns(bool) {
        // require(supportedNFTContracts[_nftContract], "NFT contract is not supported");
        require(_price > 0, "Price must be greater than zero");
        require(_tokenType == 1 || _tokenType == 2, "Invalid token type");
        require(_tokenAmount > 0, "Invalid token amount");
        require(listings[_nftContract][_tokenId].status == false, "NFT is already listed");

        if(_tokenType == 1){
            IERC721 nft = IERC721(_nftContract);
            require(nft.ownerOf(_tokenId) == msg.sender, "Only the owner can list the NFT");
            require(nft.getApproved(_tokenId) == address(this), "Need to approve this contract");

            nft.safeTransferFrom(msg.sender, address(this), _tokenId);
        }else {
            IERC1155 nft = IERC1155(_nftContract);
            require(nft.balanceOf(msg.sender, _tokenId) >= _tokenAmount, "Sender does have sufficient amount of token");

            nft.safeTransferFrom(msg.sender, address(this), _tokenId, _tokenAmount, "");
        }
        listings[_nftContract][_tokenId] = Listing(msg.sender, _price, _tokenType, _tokenAmount, true, false);

        emit ListingCreated(_nftContract, _tokenId, _price, msg.sender, _tokenType, _tokenAmount);

        return true;
    }

    /**
     * @dev this function is to remove already listed nft
     * @param _nftContract address of nft contract
     * @param _tokenId tokenid of that nft
     * @return boolean that it succeded or not
     */
    function removeListing(address _nftContract, uint256 _tokenId) external returns(bool) {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.sold == false,"Nft already sold");
        require(listing.status == true, "NFT is not listed");
        require(listing.seller == msg.sender, "Only the seller can remove the listing");

        if(listing.tokenType == 1){
            IERC721(_nftContract).safeTransferFrom(address(this), msg.sender, _tokenId);
        }else{
            IERC1155(_nftContract).safeTransferFrom(address(this), msg.sender, _tokenId, listing.tokenAmount, "");
        }

        delete listings[_nftContract][_tokenId];

        emit ListingRemoved(_nftContract, _tokenId, listing.tokenType, listing.tokenAmount);

        return true;
    }    

    /**
     * @dev this function is used to pause and unpause the sale of listed token
     * @param _nftContract address of nft contract
     * @param _tokenId tokenid of nft contract
     * @param newStatus status to update can be true or false
     * @return boolean that the transaction get success or not
     */
    function pauseUnpauseListing(address _nftContract, uint256 _tokenId, bool newStatus) external returns(bool){
        Listing storage listing = listings[_nftContract][_tokenId];
        require(listing.sold == false, "Nft already sold");
        require(listing.seller == msg.sender, "Only owner can pause the listing");

        listing.status = newStatus; // updating status

        emit ListingPausedUnpaused(_nftContract,_tokenId, listing.tokenType, msg.sender);

        return true;
    }

    /**
     * @dev this function is used to buy listed nft
     * @param _nftContract address of nft contract
     * @param _tokenId tokenid of nft contract to buy
     * @return boolean value for transaction get success or not
     */
    function buyListedNft(address _nftContract, uint256 _tokenId) external payable returns(bool){
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.sold == false, "Nft already sold");
        require(listing.status == true,"Nft not listed or paused");
        require(listing.price <= msg.value,"Insufficient amount sended");

        if(listing.tokenType == 1){
            IERC721(_nftContract).safeTransferFrom(address(this),msg.sender,_tokenId);
        } else {
            IERC1155(_nftContract).safeTransferFrom(address(this),msg.sender,_tokenId,listing.tokenAmount,"");
        }

        listing.sold = true;
        listing.status = false;

        emit ListingSold(_nftContract, _tokenId, listing.price, msg.sender, listing.seller, listing.tokenType, listing.tokenAmount);

        return true;
    }

    /**
     * @dev this function is to update price of listed nft 
     * @param _nftContract address of contract
     * @param _tokenId tokenid of nft to update
     * @param _newAmount new amount to set
     * @return boolean value for transaction get success or not
     */
    function updateListing(address _nftContract, uint256 _tokenId, uint256 _newAmount) external returns(bool){
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.sold == false,"Nft already sold");
        require(listing.seller == msg.sender,"Only owner can update listing details");
        require(_newAmount > 0,"Amount should be greater than zero");

        listing.price = _newAmount;

        emit ListingUpdated(_nftContract,_tokenId,_newAmount);

        return true;
    }

}    