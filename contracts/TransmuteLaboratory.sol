//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Transmute.sol";

contract TransmuteLaboratory {
    mapping(address => address) private _transmutations;

    function transmutation(address tokenAddress, uint256 fee) public returns (address) {
        require(tokenAddress != address(0), "TransmuteLaboratory: ZERO token address");
        require(_transmutations[tokenAddress] == address(0), "TransmuteLaboratory: transmutation already exists");
        Transmute transmute = new Transmute(tokenAddress, fee);
        _transmutations[tokenAddress] = address(transmute);
        return address(transmute);
    }

    function getTransmutation(address tokenAddress) public view returns (address) {
        return _transmutations[tokenAddress];
    }
}
