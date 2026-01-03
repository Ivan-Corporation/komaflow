// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/Koma.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract KomaTest is Test {
    Koma koma;

    address admin = address(0xA);
    address minter = address(0xB);
    address user = address(0xC);
    address receiver = address(0xD);

    // Don't call .initialize with ERC1967Proxy
    // function setUp() public {
    //     koma = new Koma();
    //     koma.initialize(admin, minter);
    // }

    function setUp() public {
        Koma implementation = new Koma();

        bytes memory initData = abi.encodeCall(
            Koma.initialize,
            (admin, minter)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        koma = Koma(address(proxy));
    }

    function testRolesAreSetCorrectly() public {
        assertTrue(koma.hasRole(koma.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(koma.hasRole(koma.MINTER_ROLE(), minter));
        assertFalse(koma.hasRole(koma.MINTER_ROLE(), user));
    }

    function testMint() public {
        vm.prank(minter);
        koma.mint(user, 1_000_000);

        assertEq(koma.balanceOf(user), 1_000_000);
        assertEq(koma.totalSupply(), 1_000_000);
    }

    function testBurn() public {
        vm.prank(minter);
        koma.mint(user, 500_000);

        vm.prank(user);
        koma.burn(200_000);

        assertEq(koma.balanceOf(user), 300_000);
        assertEq(koma.totalSupply(), 300_000);
    }

    function testBlacklistBlocksTransfer() public {
        vm.prank(minter);
        koma.mint(user, 100_000);

        vm.prank(admin);
        koma.blacklist(user);

        vm.expectRevert(
            abi.encodeWithSelector(Koma.BlacklistedAccount.selector, user)
        );
        vm.prank(user);
        koma.transfer(receiver, 10_000);
    }

    function testOnlyMinterCanMint() public {
        vm.expectRevert();
        vm.prank(user);
        koma.mint(user, 1);
    }

    function testZeroAmountMintFails() public {
        vm.expectRevert(Koma.ZeroAmount.selector);
        vm.prank(minter);
        koma.mint(user, 0);
    }
}
