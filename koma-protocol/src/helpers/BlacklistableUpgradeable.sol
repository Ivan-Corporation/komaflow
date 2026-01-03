// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ICommonErrors} from "../interfaces/ICommon.sol";

abstract contract BlacklistableUpgradeable is
    OwnableUpgradeable,
    ICommonErrors
{
    struct BlacklistableStorage {
        address blacklister;
        mapping(address user => bool isBlackListed) _blacklisted;
    }

    /// @dev keccak256(abi.encode(uint256(keccak256("koma.blacklistable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant BLACKLISTABLE_STORAGE_LOCATION =
        0x7aa1e185c99bdca7bc080880a0300f6f17167ca3d4d6cb177d4c10ba2c8c5900;

    function _getBlacklistableStorage()
        private
        pure
        returns (BlacklistableStorage storage $)
    {
        assembly {
            $.slot := BLACKLISTABLE_STORAGE_LOCATION
        }
    }

    error CallerNotBlacklister();
    error UserBlacklisted();

    event Blacklisted(address indexed _account);
    event UnBlacklisted(address indexed _account);
    event BlacklisterChanged(address indexed newBlacklister);

    function __Blacklistable_init(
        address _blacklister
    ) public onlyInitializing {
        BlacklistableStorage storage $ = _getBlacklistableStorage();
        $.blacklister = _blacklister;
        __Ownable_init(_blacklister);
    }

    /**
     * @dev Throws if called by any account other than the blacklister.
     */
    modifier onlyBlacklister() {
        BlacklistableStorage storage $ = _getBlacklistableStorage();
        require(msg.sender == $.blacklister, CallerNotBlacklister());
        _;
    }

    /**
     * @dev Throws if argument account is blacklisted.
     * @param _account The address to check.
     */ 
    modifier notBlacklisted(address _account) {
        require(!_isBlacklisted(_account), UserBlacklisted());
        _;
    }

    /**
     * @notice Checks if account is blacklisted.
     * @param _account The address to check.
     * @return True if the account is blacklisted, false if the account is not blacklisted.
     */
    function isBlacklisted(address _account) external view returns (bool) {
        return _isBlacklisted(_account);
    }

    /**
     * @notice Adds account to blacklist.
     * @param _account The address to blacklist.
     */
    function blacklist(address _account) external onlyBlacklister {
        _blacklist(_account);
        emit Blacklisted(_account);
    }

    /**
     * @notice Removes account from blacklist.
     * @param _account The address to remove from the blacklist.
     */
    function unBlacklist(address _account) external onlyBlacklister {
        _unBlacklist(_account);
        emit UnBlacklisted(_account);
    }

    /**
     * @notice Updates the blacklister address.
     * @param _newBlacklister The address of the new blacklister.
     */
    function updateBlacklister(address _newBlacklister) external onlyOwner {
        require(_newBlacklister != address(0), AddressCantBeZero());
        BlacklistableStorage storage $ = _getBlacklistableStorage();

        $.blacklister = _newBlacklister;
        emit BlacklisterChanged(_newBlacklister);
    }

    /**
     * @dev Checks if account is blacklisted.
     * @param _account The address to check.
     * @return true if the account is blacklisted, false otherwise.
     */
    function _isBlacklisted(
        address _account
    ) internal view virtual returns (bool) {
        BlacklistableStorage storage $ = _getBlacklistableStorage();

        return $._blacklisted[_account];
    }

    function _blacklist(address _account) internal {
        _setBlacklistState(_account, true);
    }

    function _unBlacklist(address _account) internal {
        _setBlacklistState(_account, false);
    }

    /**
     * @dev Helper method that sets the blacklist state of an account.
     * @param _account         The address of the account.
     * @param _shouldBlacklist True if the account should be blacklisted, false if the account should be unblacklisted.
     */
    function _setBlacklistState(
        address _account,
        bool _shouldBlacklist
    ) internal virtual {
        BlacklistableStorage storage $ = _getBlacklistableStorage();

        $._blacklisted[_account] = _shouldBlacklist;
    }
}