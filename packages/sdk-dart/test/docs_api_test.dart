import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for DocsApi
void main() {
  final instance = PaychainSdk().getDocsApi();

  group(DocsApi, () {
    // Get the machine-readable OpenAPI contract
    //
    //Future<BuiltMap<String, JsonObject>> getOpenApiContract() async
    test('test getOpenApiContract', () async {
      // TODO
    });

  });
}
