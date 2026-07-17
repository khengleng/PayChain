import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for AssetsApi
void main() {
  final instance = PaychainSdk().getAssetsApi();

  group(AssetsApi, () {
    // Activate an asset
    //
    //Future<Asset> activateAsset(String assetId, { String xCorrelationId }) async
    test('test activateAsset', () async {
      // TODO
    });

    // Burn loyalty value
    //
    //Future<TransactionRecord> burnAsset(String assetId, String idempotencyKey, BurnRequest burnRequest, { String xCorrelationId }) async
    test('test burnAsset', () async {
      // TODO
    });

    // Create an asset
    //
    //Future<Asset> createAsset(String idempotencyKey, CreateAssetRequest createAssetRequest, { String xCorrelationId }) async
    test('test createAsset', () async {
      // TODO
    });

    // Evaluate earn rules and award points
    //
    //Future<TransactionRecord> earnAsset(String assetId, String idempotencyKey, EarnRequest earnRequest, { String xCorrelationId }) async
    test('test earnAsset', () async {
      // TODO
    });

    // Get an asset
    //
    //Future<Asset> getAsset(String assetId, { String xCorrelationId }) async
    test('test getAsset', () async {
      // TODO
    });

    // Issue loyalty value
    //
    //Future<TransactionRecord> issueAsset(String assetId, String idempotencyKey, IssueRequest issueRequest, { String xCorrelationId }) async
    test('test issueAsset', () async {
      // TODO
    });

    // List assets
    //
    //Future<BuiltList<Asset>> listAssets({ String xCorrelationId }) async
    test('test listAssets', () async {
      // TODO
    });

    // Redeem loyalty value
    //
    //Future<TransactionRecord> redeemAsset(String assetId, String idempotencyKey, RedeemRequest redeemRequest, { String xCorrelationId }) async
    test('test redeemAsset', () async {
      // TODO
    });

    // Transfer loyalty value
    //
    //Future<TransactionRecord> transferAsset(String assetId, String idempotencyKey, TransferRequest transferRequest, { String xCorrelationId }) async
    test('test transferAsset', () async {
      // TODO
    });

  });
}
