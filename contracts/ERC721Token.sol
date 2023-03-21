// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract token is ERC721 {
    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol){

    }

    function mint(address _to, uint256 _tokenId) external returns(bool){
        _mint(_to, _tokenId);
        return true;
    }
}