// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {BlacklistableUpgradeable} from "./helpers/BlacklistableUpgradeable.sol";

/// @title Koma (KOMA)
/// @notice Educational synthetic asset token for Arbitrum
/// @dev Upgradeable ERC20 with minting, burning and blacklist enforcement
contract Koma is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    BlacklistableUpgradeable
{
    // -------- Roles --------

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // -------- Errors --------

    error ZeroAddress();
    error ZeroAmount();
    error BlacklistedAccount(address account);

    // -------- Events --------

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the Koma token
    /// @param admin Address with admin & blacklist control
    /// @param minter Address allowed to mint tokens
    function initialize(
        address admin,
        address minter
    ) external initializer {
        if (admin == address(0) || minter == address(0)) {
            revert ZeroAddress();
        }

        __ERC20_init("Koma", "KOMA");
        __ERC20Permit_init("Koma");
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Blacklistable_init(admin);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
    }

    /// @notice Bitcoin-style decimals
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    // -------- Mint / Burn --------

    /// @notice Mint new KOMA tokens
    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        if (amount == 0) revert ZeroAmount();
        _mint(to, amount);
        emit Minted(to, amount);
    }

    /// @notice Burn caller's tokens
    function burn(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /// @notice Burn tokens using allowance
    function burnFrom(address from, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        emit Burned(from, amount);
    }

    // -------- Transfer Hook --------

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from != address(0) && _isBlacklisted(from)) {
            revert BlacklistedAccount(from);
        }

        if (to != address(0) && _isBlacklisted(to)) {
            revert BlacklistedAccount(to);
        }

        super._update(from, to, amount);
    }

    // -------- UUPS --------

    function _authorizeUpgrade(address)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
