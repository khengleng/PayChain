# paychain_sdk.api.StablecoinsApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**activateStablecoin**](StablecoinsApi.md#activatestablecoin) | **POST** /api/v1/stablecoins/{stablecoinId}/activate | Activate a stablecoin
[**approveStablecoinGate**](StablecoinsApi.md#approvestablecoingate) | **POST** /api/v1/stablecoins/{stablecoinId}/approve-gate | Approve a stablecoin gate
[**createStablecoin**](StablecoinsApi.md#createstablecoin) | **POST** /api/v1/stablecoins | Create a stablecoin control-plane record
[**getStablecoin**](StablecoinsApi.md#getstablecoin) | **GET** /api/v1/stablecoins/{stablecoinId} | Get a stablecoin
[**listStablecoins**](StablecoinsApi.md#liststablecoins) | **GET** /api/v1/stablecoins | List stablecoins
[**submitStablecoinForReview**](StablecoinsApi.md#submitstablecoinforreview) | **POST** /api/v1/stablecoins/{stablecoinId}/submit-for-review | Submit a stablecoin for review
[**suspendStablecoin**](StablecoinsApi.md#suspendstablecoin) | **POST** /api/v1/stablecoins/{stablecoinId}/suspend | Suspend stablecoin minting, redemption, or both


# **activateStablecoin**
> Stablecoin activateStablecoin(stablecoinId, xCorrelationId)

Activate a stablecoin

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinsApi();
final String stablecoinId = stablecoinId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.activateStablecoin(stablecoinId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinsApi->activateStablecoin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **stablecoinId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **approveStablecoinGate**
> Stablecoin approveStablecoinGate(stablecoinId, approveStablecoinGateRequest, xCorrelationId)

Approve a stablecoin gate

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinsApi();
final String stablecoinId = stablecoinId_example; // String | 
final ApproveStablecoinGateRequest approveStablecoinGateRequest = ; // ApproveStablecoinGateRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.approveStablecoinGate(stablecoinId, approveStablecoinGateRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinsApi->approveStablecoinGate: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **stablecoinId** | **String**|  | 
 **approveStablecoinGateRequest** | [**ApproveStablecoinGateRequest**](ApproveStablecoinGateRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createStablecoin**
> Stablecoin createStablecoin(idempotencyKey, createStablecoinRequest, xCorrelationId)

Create a stablecoin control-plane record

Feature-flag gated; public issuance remains disabled until readiness gates pass.

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinsApi();
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final CreateStablecoinRequest createStablecoinRequest = ; // CreateStablecoinRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.createStablecoin(idempotencyKey, createStablecoinRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinsApi->createStablecoin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **createStablecoinRequest** | [**CreateStablecoinRequest**](CreateStablecoinRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getStablecoin**
> Stablecoin getStablecoin(stablecoinId, xCorrelationId)

Get a stablecoin

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinsApi();
final String stablecoinId = stablecoinId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.getStablecoin(stablecoinId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinsApi->getStablecoin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **stablecoinId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listStablecoins**
> BuiltList<Stablecoin> listStablecoins(xCorrelationId)

List stablecoins

Stablecoin features are disabled by default until readiness gates pass.

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinsApi();
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.listStablecoins(xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinsApi->listStablecoins: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**BuiltList&lt;Stablecoin&gt;**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **submitStablecoinForReview**
> Stablecoin submitStablecoinForReview(stablecoinId, xCorrelationId)

Submit a stablecoin for review

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinsApi();
final String stablecoinId = stablecoinId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.submitStablecoinForReview(stablecoinId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinsApi->submitStablecoinForReview: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **stablecoinId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **suspendStablecoin**
> Stablecoin suspendStablecoin(stablecoinId, suspendStablecoinRequest, xCorrelationId)

Suspend stablecoin minting, redemption, or both

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getStablecoinsApi();
final String stablecoinId = stablecoinId_example; // String | 
final SuspendStablecoinRequest suspendStablecoinRequest = ; // SuspendStablecoinRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.suspendStablecoin(stablecoinId, suspendStablecoinRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StablecoinsApi->suspendStablecoin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **stablecoinId** | **String**|  | 
 **suspendStablecoinRequest** | [**SuspendStablecoinRequest**](SuspendStablecoinRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

