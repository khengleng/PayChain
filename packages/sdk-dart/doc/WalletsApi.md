# paychain_sdk.api.WalletsApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createWallet**](WalletsApi.md#createwallet) | **POST** /api/v1/wallets | Create a managed custodial wallet
[**getWallet**](WalletsApi.md#getwallet) | **GET** /api/v1/wallets/{walletId} | Get a wallet
[**listWalletBalances**](WalletsApi.md#listwalletbalances) | **GET** /api/v1/wallets/{walletId}/balances | List wallet balances


# **createWallet**
> Wallet createWallet(idempotencyKey, createWalletRequest, xCorrelationId)

Create a managed custodial wallet

Creates the Stellar account and records the wallet under the caller tenant.

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getWalletsApi();
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final CreateWalletRequest createWalletRequest = ; // CreateWalletRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.createWallet(idempotencyKey, createWalletRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling WalletsApi->createWallet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **createWalletRequest** | [**CreateWalletRequest**](CreateWalletRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Wallet**](Wallet.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getWallet**
> Wallet getWallet(walletId, xCorrelationId)

Get a wallet

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getWalletsApi();
final String walletId = walletId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.getWallet(walletId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling WalletsApi->getWallet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **walletId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Wallet**](Wallet.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listWalletBalances**
> BuiltList<Balance> listWalletBalances(walletId, xCorrelationId)

List wallet balances

Refreshes the rebuildable balance read model from chain before returning balances.

### Example
```dart
import 'package:paychain_sdk/api.dart';
// TODO Configure OAuth2 access token for authorization: oauth2ClientCredentials
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getWalletsApi();
final String walletId = walletId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.listWalletBalances(walletId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling WalletsApi->listWalletBalances: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **walletId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**BuiltList&lt;Balance&gt;**](Balance.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

