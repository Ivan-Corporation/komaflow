// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Koma.sol";
import "../src/KomaV2.sol";

contract UpgradeKoma is Script {
    function run() external {
        address proxy = vm.envAddress("KOMA_PROXY");

        vm.startBroadcast();

        KomaV2 newImpl = new KomaV2();

        // OZ v5 UUPS upgrade
        Koma(proxy).upgradeToAndCall(
            address(newImpl),
            ""
        );

        vm.stopBroadcast();
    }
}
