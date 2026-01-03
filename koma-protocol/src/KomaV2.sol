// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Koma.sol";

contract KomaV2 is Koma {
    /// @notice New function added in V2
    function version() external pure returns (string memory) {
        return "Koma V2 Test";
    }
}
