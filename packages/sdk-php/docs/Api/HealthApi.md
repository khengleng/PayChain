# PayChainSdk\HealthApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**getBlockchainHealth()**](HealthApi.md#getBlockchainHealth) | **GET** /api/v1/health/blockchain | Blockchain provider health |
| [**getHealth()**](HealthApi.md#getHealth) | **GET** /api/v1/health | Liveness probe |
| [**getReadiness()**](HealthApi.md#getReadiness) | **GET** /api/v1/health/ready | Readiness probe |


## `getBlockchainHealth()`

```php
getBlockchainHealth(): array<string,mixed>
```

Blockchain provider health

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');



$apiInstance = new PayChainSdk\Api\HealthApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);

try {
    $result = $apiInstance->getBlockchainHealth();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling HealthApi->getBlockchainHealth: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

This endpoint does not need any parameter.

### Return type

**array<string,mixed>**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `getHealth()`

```php
getHealth(): \PayChainSdk\Model\Health
```

Liveness probe

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');



$apiInstance = new PayChainSdk\Api\HealthApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);

try {
    $result = $apiInstance->getHealth();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling HealthApi->getHealth: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**\PayChainSdk\Model\Health**](../Model/Health.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `getReadiness()`

```php
getReadiness(): \PayChainSdk\Model\HealthReady
```

Readiness probe

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');



$apiInstance = new PayChainSdk\Api\HealthApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);

try {
    $result = $apiInstance->getReadiness();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling HealthApi->getReadiness: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**\PayChainSdk\Model\HealthReady**](../Model/HealthReady.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
