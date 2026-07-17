# paychain_sdk.api.DocsApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getOpenApiContract**](DocsApi.md#getopenapicontract) | **GET** /api/v1/openapi.json | Get the machine-readable OpenAPI contract


# **getOpenApiContract**
> BuiltMap<String, JsonObject> getOpenApiContract()

Get the machine-readable OpenAPI contract

### Example
```dart
import 'package:paychain_sdk/api.dart';

final api = PaychainSdk().getDocsApi();

try {
    final response = api.getOpenApiContract();
    print(response);
} on DioException catch (e) {
    print('Exception when calling DocsApi->getOpenApiContract: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

