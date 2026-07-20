// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * PayChainToken — a merchant coin (reserve-backed stablecoin, branded as loyalty points) as an
 * ERC-20 on an EVM chain (Base). One deployment per merchant coin.
 *
 * Custody model: PayChain holds the minter key and the per-customer account keys (custodial), and
 * signs on their behalf — the on-chain accounts exist so a customer can *view* their balance in
 * MetaMask by the token's contract address. Reserve backing, mint gating, and the tie-out stay on
 * PayChain's side exactly as on Stellar; this contract only records supply/movement on chain.
 *
 * - MINTER_ROLE mints new supply (PayChain's minter key, ideally an HSM/KMS key). Mint is gated
 *   OFF-chain by the reserve controls before this is ever called.
 * - Anyone can burn their OWN balance (ERC20Burnable) — the "spend / redeem" burn is the holder's
 *   account (which PayChain signs custodially) burning its tokens; supply drops accordingly.
 * - `decimals` is set at deploy so the on-chain unit matches PayChain's fixed-point amounts.
 */
contract PayChainToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint8 private immutable _decimals;

    /**
     * @param name_    Human name, e.g. "PayKH Points".
     * @param symbol_  Ticker, e.g. "PKHPTS".
     * @param decimals_ On-chain decimals (match your PayChain unit; e.g. 7 for Stellar-parity, or 6/18).
     * @param admin    Holds DEFAULT_ADMIN_ROLE (can grant/revoke roles) — a PayChain-controlled key.
     * @param minter   Holds MINTER_ROLE — the account PayChain signs mints with.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address admin,
        address minter
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// Mint new supply to `to`. Restricted to MINTER_ROLE; reserve-gated off-chain before this call.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
