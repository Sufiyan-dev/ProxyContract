// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract token2 is ERC1155 {
    constructor() ERC1155("") {

    }

    function mint(address _to, uint256 _tokenId, uint256 _amount, bytes memory _data) external returns(bool){
        _mint(_to, _tokenId, _amount, _data);
        return true;
    }
}