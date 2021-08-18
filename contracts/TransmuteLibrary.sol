//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

library TransmuteLibrary {
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256) {
        require(amountIn > 0, "TransmuteLibrary: zero input amount");
        require(reserveIn > 0 && reserveOut > 0, "TransmuteLibrary: Not enough liquidity");
        return (reserveOut * amountIn) / (reserveIn + amountIn);
    }
}
