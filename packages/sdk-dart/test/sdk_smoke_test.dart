import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';

void main() {
  group('PayChain Dart SDK smoke', () {
    test('exports health model and API surface', () {
      final health = Health((b) => b..status = 'ok');
      final sdk = PaychainSdk(basePathOverride: 'https://api.paychain.example');

      expect(health.status, 'ok');
      expect(sdk.getHealthApi(), isA<HealthApi>());
      expect(
        standardSerializers.serializeWith(Health.serializer, health),
        isNotNull,
      );
    });
  });
}
