import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for WalletsApi
void main() {
  final instance = PaychainSdk().getWalletsApi();

  group(WalletsApi, () {
    // Create a managed custodial wallet
    //
    // Creates the Stellar account and records the wallet under the caller tenant.
    //
    //Future<Wallet> createWallet(String idempotencyKey, CreateWalletRequest createWalletRequest, { String xCorrelationId }) async
    test('test createWallet', () async {
      // TODO
    });

    // Get a wallet
    //
    //Future<Wallet> getWallet(String walletId, { String xCorrelationId }) async
    test('test getWallet', () async {
      // TODO
    });

    // List wallet balances
    //
    // Refreshes the rebuildable balance read model from chain before returning balances.
    //
    //Future<BuiltList<Balance>> listWalletBalances(String walletId, { String xCorrelationId }) async
    test('test listWalletBalances', () async {
      // TODO
    });

  });
}
