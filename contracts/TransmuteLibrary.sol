//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

library TransmuteLibrary {
    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) internal pure returns (uint256) {
        require(amountIn > 0, "TransmuteLibrary: zero input amount");
        require(reserveIn > 0 && reserveOut > 0, "TransmuteLibrary: Not enough liquidity");
        uint256 amountInWithFee = amountIn * (1000 - fee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (uint256) {
        require(amountA > 0, "TransmuteLibrary: insufficient amount");
        require(reserveA > 0 && reserveB > 0, "TransmuteLibrary: insufficient liquidity");
        return (amountA * reserveB) / reserveA;
    }
}
