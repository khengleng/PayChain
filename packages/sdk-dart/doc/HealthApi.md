# paychain_sdk.api.HealthApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getBlockchainHealth**](HealthApi.md#getblockchainhealth) | **GET** /api/v1/health/blockchain | Blockchain provider health
[**getHealth**](HealthApi.md#gethealth) | **GET** /api/v1/health | Liveness probe
[**getReadiness**](HealthApi.md#getreadiness) | **GET** /api/v1/health/ready | Readiness probe


# **getBlockchainHealth**
> BuiltMap<String, JsonObject> getBlockchainHealth()

Blockchain provider health

### Example
```dart
import 'package:paychain_sdk/api.dart';

final api = PaychainSdk().getHealthApi();

try {
    final response = api.getBlockchainHealth();
    print(response);
} on DioException catch (e) {
    print('Exception when calling HealthApi->getBlockchainHealth: $e\n');
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

# **getHealth**
> Health getHealth()

Liveness probe

### Example
```dart
import 'package:paychain_sdk/api.dart';

final api = PaychainSdk().getHealthApi();

try {
    final response = api.getHealth();
    print(response);
} on DioException catch (e) {
    print('Exception when calling HealthApi->getHealth: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**Health**](Health.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getReadiness**
> HealthReady getReadiness()

Readiness probe

### Example
```dart
import 'package:paychain_sdk/api.dart';

final api = PaychainSdk().getHealthApi();

try {
    final response = api.getReadiness();
    print(response);
} on DioException catch (e) {
    print('Exception when calling HealthApi->getReadiness: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**HealthReady**](HealthReady.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

