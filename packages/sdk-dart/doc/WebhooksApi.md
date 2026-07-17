# paychain_sdk.api.WebhooksApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createWebhook**](WebhooksApi.md#createwebhook) | **POST** /api/v1/webhooks | Register a webhook endpoint
[**disableWebhook**](WebhooksApi.md#disablewebhook) | **DELETE** /api/v1/webhooks/{id} | Disable a webhook endpoint
[**listWebhooks**](WebhooksApi.md#listwebhooks) | **GET** /api/v1/webhooks | List webhook endpoints
[**rotateWebhookSecret**](WebhooksApi.md#rotatewebhooksecret) | **POST** /api/v1/webhooks/{id}/rotate-secret | Rotate webhook signing secret


# **createWebhook**
> WebhookEndpointWithSecret createWebhook(webhookCreateRequest, xCorrelationId)

Register a webhook endpoint

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getWebhooksApi();
final WebhookCreateRequest webhookCreateRequest = ; // WebhookCreateRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.createWebhook(webhookCreateRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling WebhooksApi->createWebhook: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **webhookCreateRequest** | [**WebhookCreateRequest**](WebhookCreateRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**WebhookEndpointWithSecret**](WebhookEndpointWithSecret.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **disableWebhook**
> disableWebhook(id, xCorrelationId)

Disable a webhook endpoint

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getWebhooksApi();
final String id = id_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    api.disableWebhook(id, xCorrelationId);
} on DioException catch (e) {
    print('Exception when calling WebhooksApi->disableWebhook: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

void (empty response body)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listWebhooks**
> BuiltList<WebhookEndpoint> listWebhooks(xCorrelationId)

List webhook endpoints

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getWebhooksApi();
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.listWebhooks(xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling WebhooksApi->listWebhooks: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**BuiltList&lt;WebhookEndpoint&gt;**](WebhookEndpoint.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **rotateWebhookSecret**
> WebhookEndpointWithSecret rotateWebhookSecret(id, xCorrelationId)

Rotate webhook signing secret

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getWebhooksApi();
final String id = id_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.rotateWebhookSecret(id, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling WebhooksApi->rotateWebhookSecret: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**WebhookEndpointWithSecret**](WebhookEndpointWithSecret.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

