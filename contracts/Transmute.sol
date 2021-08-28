//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./TransmuteLibrary.sol";

contract Transmute is ERC20 {
    using Address for address payable;

    address private _token;

    constructor(address token_) ERC20("FLAMEL", "FLAM") {
        require(token_ != address(0), "Transmute: Zero address token");
        _token = token_;
    }

    function addLiquidity(uint256 tokenAmountIn) public payable returns (uint256) {
        uint256 liquidity;
        // pool is empty
        if (getReserve() == 0) {
            IERC20(_token).transferFrom(msg.sender, address(this), tokenAmountIn);
            liquidity = address(this).balance;
        } else {
            // pool is not empty so need to check ratio
            uint256 ethReserve = address(this).balance - msg.value;
            uint256 tokenReserve = getReserve();
            uint256 tokenAmount = quote(msg.value, ethReserve, tokenReserve);
            require(tokenAmountIn >= tokenAmount, "Transmute: insufficient amount");
            IERC20(_token).transferFrom(msg.sender, address(this), tokenAmount);
            liquidity = (totalSupply() * msg.value) / ethReserve;
        }
        _mint(msg.sender, liquidity);
        return liquidity;
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

    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure returns (uint256) {
        return TransmuteLibrary.quote(amountA, reserveA, reserveB);
    }
}
