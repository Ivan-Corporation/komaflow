// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/Koma.sol";

contract DeployKoma is Script {
    function run() external returns (address proxyAddress) {
        address admin = vm.envAddress("ADMIN");
        address minter = vm.envAddress("MINTER");

        vm.startBroadcast();

        // 1. Deploy implementation
        Koma implementation = new Koma();

        // 2. Encode initializer call
        bytes memory initData = abi.encodeCall(
            Koma.initialize,
            (admin, minter)
        );

        // 3. Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        vm.stopBroadcast();

        return address(proxy);
    }
}
