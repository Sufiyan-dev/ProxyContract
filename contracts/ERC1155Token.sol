// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Token2 is ERC1155 {
    constructor() ERC1155("") {

    }

    function mint(address to, uint256 tokenId, uint256 amount, bytes memory data) external returns(bool){
        _mint(to, tokenId, amount, data);
        return true;
    }
}