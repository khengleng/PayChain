import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for StablecoinsApi
void main() {
  final instance = PaychainSdk().getStablecoinsApi();

  group(StablecoinsApi, () {
    // Activate a stablecoin
    //
    //Future<Stablecoin> activateStablecoin(String stablecoinId, { String xCorrelationId }) async
    test('test activateStablecoin', () async {
      // TODO
    });

    // Approve a stablecoin gate
    //
    //Future<Stablecoin> approveStablecoinGate(String stablecoinId, ApproveStablecoinGateRequest approveStablecoinGateRequest, { String xCorrelationId }) async
    test('test approveStablecoinGate', () async {
      // TODO
    });

    // Create a stablecoin control-plane record
    //
    // Feature-flag gated; public issuance remains disabled until readiness gates pass.
    //
    //Future<Stablecoin> createStablecoin(String idempotencyKey, CreateStablecoinRequest createStablecoinRequest, { String xCorrelationId }) async
    test('test createStablecoin', () async {
      // TODO
    });

    // Get a stablecoin
    //
    //Future<Stablecoin> getStablecoin(String stablecoinId, { String xCorrelationId }) async
    test('test getStablecoin', () async {
      // TODO
    });

    // List stablecoins
    //
    // Stablecoin features are disabled by default until readiness gates pass.
    //
    //Future<BuiltList<Stablecoin>> listStablecoins({ String xCorrelationId }) async
    test('test listStablecoins', () async {
      // TODO
    });

    // Submit a stablecoin for review
    //
    //Future<Stablecoin> submitStablecoinForReview(String stablecoinId, { String xCorrelationId }) async
    test('test submitStablecoinForReview', () async {
      // TODO
    });

    // Suspend stablecoin minting, redemption, or both
    //
    //Future<Stablecoin> suspendStablecoin(String stablecoinId, SuspendStablecoinRequest suspendStablecoinRequest, { String xCorrelationId }) async
    test('test suspendStablecoin', () async {
      // TODO
    });

  });
}
