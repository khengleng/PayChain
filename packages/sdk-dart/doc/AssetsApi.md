# paychain_sdk.api.AssetsApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**activateAsset**](AssetsApi.md#activateasset) | **POST** /api/v1/assets/{assetId}/activate | Activate an asset
[**burnAsset**](AssetsApi.md#burnasset) | **POST** /api/v1/assets/{assetId}/burn | Burn loyalty value
[**createAsset**](AssetsApi.md#createasset) | **POST** /api/v1/assets | Create an asset
[**earnAsset**](AssetsApi.md#earnasset) | **POST** /api/v1/assets/{assetId}/earn | Evaluate earn rules and award points
[**getAsset**](AssetsApi.md#getasset) | **GET** /api/v1/assets/{assetId} | Get an asset
[**issueAsset**](AssetsApi.md#issueasset) | **POST** /api/v1/assets/{assetId}/issue | Issue loyalty value
[**listAssets**](AssetsApi.md#listassets) | **GET** /api/v1/assets | List assets
[**redeemAsset**](AssetsApi.md#redeemasset) | **POST** /api/v1/assets/{assetId}/redeem | Redeem loyalty value
[**transferAsset**](AssetsApi.md#transferasset) | **POST** /api/v1/assets/{assetId}/transfer | Transfer loyalty value


# **activateAsset**
> Asset activateAsset(assetId, xCorrelationId)

Activate an asset

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String assetId = assetId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.activateAsset(assetId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->activateAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Asset**](Asset.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **burnAsset**
> TransactionRecord burnAsset(assetId, idempotencyKey, burnRequest, xCorrelationId)

Burn loyalty value

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String assetId = assetId_example; // String | 
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final BurnRequest burnRequest = ; // BurnRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.burnAsset(assetId, idempotencyKey, burnRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->burnAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **burnRequest** | [**BurnRequest**](BurnRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createAsset**
> Asset createAsset(idempotencyKey, createAssetRequest, xCorrelationId)

Create an asset

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final CreateAssetRequest createAssetRequest = ; // CreateAssetRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.createAsset(idempotencyKey, createAssetRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->createAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **createAssetRequest** | [**CreateAssetRequest**](CreateAssetRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Asset**](Asset.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **earnAsset**
> TransactionRecord earnAsset(assetId, idempotencyKey, earnRequest, xCorrelationId)

Evaluate earn rules and award points

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String assetId = assetId_example; // String | 
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final EarnRequest earnRequest = ; // EarnRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.earnAsset(assetId, idempotencyKey, earnRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->earnAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **earnRequest** | [**EarnRequest**](EarnRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAsset**
> Asset getAsset(assetId, xCorrelationId)

Get an asset

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String assetId = assetId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.getAsset(assetId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->getAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Asset**](Asset.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **issueAsset**
> TransactionRecord issueAsset(assetId, idempotencyKey, issueRequest, xCorrelationId)

Issue loyalty value

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String assetId = assetId_example; // String | 
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final IssueRequest issueRequest = ; // IssueRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.issueAsset(assetId, idempotencyKey, issueRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->issueAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **issueRequest** | [**IssueRequest**](IssueRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listAssets**
> BuiltList<Asset> listAssets(xCorrelationId)

List assets

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.listAssets(xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->listAssets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**BuiltList&lt;Asset&gt;**](Asset.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **redeemAsset**
> TransactionRecord redeemAsset(assetId, idempotencyKey, redeemRequest, xCorrelationId)

Redeem loyalty value

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String assetId = assetId_example; // String | 
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final RedeemRequest redeemRequest = ; // RedeemRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.redeemAsset(assetId, idempotencyKey, redeemRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->redeemAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **redeemRequest** | [**RedeemRequest**](RedeemRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **transferAsset**
> TransactionRecord transferAsset(assetId, idempotencyKey, transferRequest, xCorrelationId)

Transfer loyalty value

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getAssetsApi();
final String assetId = assetId_example; // String | 
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final TransferRequest transferRequest = ; // TransferRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.transferAsset(assetId, idempotencyKey, transferRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AssetsApi->transferAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **transferRequest** | [**TransferRequest**](TransferRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

