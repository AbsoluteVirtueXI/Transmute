//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./TransmuteLibrary.sol";

contract Transmute is ERC20 {
    using Address for address payable;

    address private _token;
    // percentage = _fee * 100 / 1000
    // if _fee = 3 then fee percetange is 0.3%
    uint256 private _fee;

    constructor(address token_, uint256 fee_) ERC20("FLAMEL", "FLAM") {
        require(token_ != address(0), "Transmute: Zero address token");
        _token = token_;
        _fee = fee_;
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

    function removeLiquidity(
        uint256 liquidity,
        uint256 ethAmountMin,
        uint256 tokenAmountMin
    ) public returns (uint256, uint256) {
        uint256 ethAmount = (address(this).balance * liquidity) / totalSupply();
        require(ethAmount >= ethAmountMin, "Transmute: Insufficient ETH amount out");
        uint256 tokenAmount = (getReserve() * liquidity) / totalSupply();
        require(tokenAmount >= tokenAmountMin, "Transmute: Insufficient FLAMEL amount out");
        _burn(msg.sender, liquidity);
        payable(msg.sender).sendValue(ethAmount);
        IERC20(_token).transfer(msg.sender, tokenAmount);
        return (ethAmount, tokenAmount);
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

    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure returns (uint256) {
        return TransmuteLibrary.quote(amountA, reserveA, reserveB);
    }

    function fee() public view returns (uint256) {
        return _fee;
    }

    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) private view returns (uint256) {
        return TransmuteLibrary.getAmountOut(amountIn, reserveIn, reserveOut, _fee);
    }
}
