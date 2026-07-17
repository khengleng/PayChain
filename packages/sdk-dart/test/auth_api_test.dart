import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for AuthApi
void main() {
  final instance = PaychainSdk().getAuthApi();

  group(AuthApi, () {
    // Exchange client credentials for a bearer token
    //
    //Future<TokenResponse> issueAccessToken(TokenRequest tokenRequest) async
    test('test issueAccessToken', () async {
      // TODO
    });

  });
}
