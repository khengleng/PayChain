import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for HealthApi
void main() {
  final instance = PaychainSdk().getHealthApi();

  group(HealthApi, () {
    // Blockchain provider health
    //
    //Future<BuiltMap<String, JsonObject>> getBlockchainHealth() async
    test('test getBlockchainHealth', () async {
      // TODO
    });

    // Liveness probe
    //
    //Future<Health> getHealth() async
    test('test getHealth', () async {
      // TODO
    });

    // Readiness probe
    //
    //Future<HealthReady> getReadiness() async
    test('test getReadiness', () async {
      // TODO
    });

  });
}
