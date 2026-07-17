import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for StablecoinWorkflowsApi
void main() {
  final instance = PaychainSdk().getStablecoinWorkflowsApi();

  group(StablecoinWorkflowsApi, () {
    // Create a mint request
    //
    //Future<BuiltMap<String, JsonObject>> createMintRequest(String id, String idempotencyKey, MintRequest mintRequest, { String xCorrelationId }) async
    test('test createMintRequest', () async {
      // TODO
    });

    // Create a redemption request
    //
    //Future<BuiltMap<String, JsonObject>> createRedemptionRequest(String id, String idempotencyKey, RedemptionRequest redemptionRequest, { String xCorrelationId }) async
    test('test createRedemptionRequest', () async {
      // TODO
    });

    // Quote a loyalty to stablecoin conversion
    //
    //Future<BuiltMap<String, JsonObject>> quoteConversion(String idempotencyKey, ConversionQuoteRequest conversionQuoteRequest, { String xCorrelationId }) async
    test('test quoteConversion', () async {
      // TODO
    });

  });
}
