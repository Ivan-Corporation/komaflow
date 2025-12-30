// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/Koma.sol";

contract KomaTest is Test {
    Koma koma;

    address admin = address(0xA);
    address minter = address(0xB);
    address user = address(0xC);

    function setUp() public {
        koma = new Koma();
        koma.initialize(admin, minter);
    }

    function testMint() public {
        vm.prank(minter);
        koma.mint(user, 1_000_000);

        assertEq(koma.balanceOf(user), 1_000_000);
    }

    function testBurn() public {
        vm.prank(minter);
        koma.mint(user, 500_000);

        vm.prank(user);
        koma.burn(200_000);

        assertEq(koma.balanceOf(user), 300_000);
    }

    function testBlacklistBlocksTransfer() public {
        vm.prank(minter);
        koma.mint(user, 100_000);

        vm.prank(admin);
        koma.blacklist(user);

        vm.expectRevert();
        vm.prank(user);
        koma.transfer(address(0xD), 10_000);
    }

    function testOnlyMinterCanMint() public {
        vm.expectRevert();
        vm.prank(user);
        koma.mint(user, 1);
    }
}
