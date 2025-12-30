// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Koma.sol";

contract DeployKoma is Script {
    function run() external returns (Koma) {
        address admin = vm.envAddress("ADMIN");
        address minter = vm.envAddress("MINTER");

        vm.startBroadcast();
        Koma koma = new Koma();
        koma.initialize(admin, minter);
        vm.stopBroadcast();

        return koma;
    }
}
