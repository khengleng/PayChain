// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PayChainToken} from "../src/PayChainToken.sol";

/**
 * Deploys one PayChainToken (one merchant coin). Set these env vars, then run the command below.
 *
 *   TOKEN_NAME      e.g. "PayKH Points"
 *   TOKEN_SYMBOL    e.g. "PKHPTS"
 *   TOKEN_DECIMALS  e.g. 7  (match your PayChain unit; Stellar-parity is 7)
 *   TOKEN_ADMIN     0x… admin address (a PayChain-controlled key; can grant/revoke roles)
 *   TOKEN_MINTER    0x… minter address (the account PayChain signs mints with = EVM issuer key)
 *   PRIVATE_KEY     0x… deployer key (needs Base Sepolia ETH for gas)
 *
 * Base Sepolia:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url "$BASE_SEPOLIA_RPC_URL" --broadcast --verify
 *
 * The printed contract address is what PayChain needs as EVM_TOKEN_ADDRESS (and as the Asset row's
 * issuerPublicKey); TOKEN_MINTER's private key is the issuer/minter secret PayChain signs mints with.
 */
contract Deploy is Script {
    function run() external returns (PayChainToken token) {
        string memory name = vm.envString("TOKEN_NAME");
        string memory symbol = vm.envString("TOKEN_SYMBOL");
        uint8 decimals = uint8(vm.envUint("TOKEN_DECIMALS"));
        address admin = vm.envAddress("TOKEN_ADMIN");
        address minter = vm.envAddress("TOKEN_MINTER");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        token = new PayChainToken(name, symbol, decimals, admin, minter);
        vm.stopBroadcast();

        console2.log("PayChainToken deployed at:", address(token));
        console2.log("  name/symbol:", name, symbol);
        console2.log("  decimals:", decimals);
        console2.log("  admin:", admin);
        console2.log("  minter (EVM issuer key):", minter);
    }
}
