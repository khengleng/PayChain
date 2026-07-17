# paychain_sdk.api.AuthApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**issueAccessToken**](AuthApi.md#issueaccesstoken) | **POST** /api/v1/oauth/token | Exchange client credentials for a bearer token


# **issueAccessToken**
> TokenResponse issueAccessToken(tokenRequest)

Exchange client credentials for a bearer token

### Example
```dart
import 'package:paychain_sdk/api.dart';

final api = PaychainSdk().getAuthApi();
final TokenRequest tokenRequest = ; // TokenRequest | 

try {
    final response = api.issueAccessToken(tokenRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AuthApi->issueAccessToken: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **tokenRequest** | [**TokenRequest**](TokenRequest.md)|  | 

### Return type

[**TokenResponse**](TokenResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

