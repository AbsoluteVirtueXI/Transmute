//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./TransmuteLibrary.sol";

contract Transmute {
    using Address for address payable;

    address private _token;

    constructor(address token_) {
        require(token_ != address(0), "Transmute: Zero address token");
        _token = token_;
    }

    function addLiquidity(uint256 amount) public payable {
        IERC20(_token).transferFrom(msg.sender, address(this), amount);
    }

    function swapEthToToken(uint256 amountOutMin) public payable {
        uint256 amountOut = _getAmountOut(msg.value, address(this).balance - msg.value, getReserve());
        require(amountOut >= amountOutMin, "Transmute: Insufficient amount out");
        IERC20(_token).transfer(msg.sender, amountOut);
    }

    function swapTokenToEth(uint256 amountIn, uint256 amountOutMin) public {
        uint256 amountOut = getEthAmountOut(amountIn);
        require(amountOut >= amountOutMin, "Transmute: Insufficient amount out");
        IERC20(_token).transferFrom(msg.sender, address(this), amountIn);
        payable(msg.sender).sendValue(amountOut);
    }

    function getReserve() public view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    function getEthAmountOut(uint256 amountIn) public view returns (uint256) {
        return _getAmountOut(amountIn, getReserve(), address(this).balance);
    }

    function getTokenAmountOut(uint256 amountIn) public view returns (uint256) {
        return _getAmountOut(amountIn, address(this).balance, getReserve());
    }

    function token() public view returns (address) {
        return _token;
    }

    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) private pure returns (uint256) {
        return TransmuteLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
    }
}
