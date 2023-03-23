// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Token is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol){

    }

    function mint(address to, uint256 tokenId) external returns(bool){
        _mint(to, tokenId);
        return true;
    }
}