//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TransmuteLibrary.sol";

contract Transmute {
    address private _token;

    constructor(address token_) {
        require(token_ != address(0), "Transmute: Zero address token");
        _token = token_;
    }

    function addLiquidity(uint256 amount) public payable {
        IERC20(_token).transferFrom(msg.sender, address(this), amount);
    }

    function getReserve() public view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    function token() public view returns (address) {
        return _token;
    }

    function getEthAmount(uint256 amountIn) public view returns (uint256) {
        return _getAmountOut(amountIn, getReserve(), address(this).balance);
    }

    function getTokenAmount(uint256 amountIn) public view returns (uint256) {
        return _getAmountOut(amountIn, address(this).balance, getReserve());
    }

    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) private pure returns (uint256) {
        return TransmuteLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }
}
