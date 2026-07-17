import 'package:test/test.dart';
import 'package:paychain_sdk/paychain_sdk.dart';


/// tests for WebhooksApi
void main() {
  final instance = PaychainSdk().getWebhooksApi();

  group(WebhooksApi, () {
    // Register a webhook endpoint
    //
    //Future<WebhookEndpointWithSecret> createWebhook(WebhookCreateRequest webhookCreateRequest, { String xCorrelationId }) async
    test('test createWebhook', () async {
      // TODO
    });

    // Disable a webhook endpoint
    //
    //Future disableWebhook(String id, { String xCorrelationId }) async
    test('test disableWebhook', () async {
      // TODO
    });

    // List webhook endpoints
    //
    //Future<BuiltList<WebhookEndpoint>> listWebhooks({ String xCorrelationId }) async
    test('test listWebhooks', () async {
      // TODO
    });

    // Rotate webhook signing secret
    //
    //Future<WebhookEndpointWithSecret> rotateWebhookSecret(String id, { String xCorrelationId }) async
    test('test rotateWebhookSecret', () async {
      // TODO
    });

  });
}
