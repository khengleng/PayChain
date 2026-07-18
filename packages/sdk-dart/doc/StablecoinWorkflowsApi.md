# paychain_sdk.api.StablecoinWorkflowsApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createMintRequest**](StablecoinWorkflowsApi.md#createmintrequest) | **POST** /api/v1/stablecoins/{id}/mint-requests | Create a mint request
[**createRedemptionRequest**](StablecoinWorkflowsApi.md#createredemptionrequest) | **POST** /api/v1/stablecoins/{id}/redemptions | Create a redemption request
[**quoteConversion**](StablecoinWorkflowsApi.md#quoteconversion) | **POST** /api/v1/conversions/quote | Quote a loyalty to stablecoin conversion


# **createMintRequest**
> BuiltMap<String, JsonObject> createMintRequest(id, idempotencyKey, mintRequest, xCorrelationId)

Create a mint request

### Example
```dart
import 'package:paychain_sdk/api.dart';
// Configure OAuth2 client credentials before calling authenticated endpoints.
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinWorkflowsApi();
final String id = id_example; // String | 
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final MintRequest mintRequest = ; // MintRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.createMintRequest(id, idempotencyKey, mintRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinWorkflowsApi->createMintRequest: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **mintRequest** | [**MintRequest**](MintRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createRedemptionRequest**
> BuiltMap<String, JsonObject> createRedemptionRequest(id, idempotencyKey, redemptionRequest, xCorrelationId)

Create a redemption request

### Example
```dart
import 'package:paychain_sdk/api.dart';
// Configure OAuth2 client credentials before calling authenticated endpoints.
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinWorkflowsApi();
final String id = id_example; // String | 
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final RedemptionRequest redemptionRequest = ; // RedemptionRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.createRedemptionRequest(id, idempotencyKey, redemptionRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinWorkflowsApi->createRedemptionRequest: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **redemptionRequest** | [**RedemptionRequest**](RedemptionRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **quoteConversion**
> BuiltMap<String, JsonObject> quoteConversion(idempotencyKey, conversionQuoteRequest, xCorrelationId)

Quote a loyalty to stablecoin conversion

### Example
```dart
import 'package:paychain_sdk/api.dart';
// Configure OAuth2 client credentials before calling authenticated endpoints.
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinWorkflowsApi();
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final ConversionQuoteRequest conversionQuoteRequest = ; // ConversionQuoteRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.quoteConversion(idempotencyKey, conversionQuoteRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinWorkflowsApi->quoteConversion: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **conversionQuoteRequest** | [**ConversionQuoteRequest**](ConversionQuoteRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

