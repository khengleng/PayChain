# PayChainSdk\DocsApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**getOpenApiContract()**](DocsApi.md#getOpenApiContract) | **GET** /api/v1/openapi.json | Get the machine-readable OpenAPI contract |


## `getOpenApiContract()`

```php
getOpenApiContract(): array<string,mixed>
```

Get the machine-readable OpenAPI contract

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');



$apiInstance = new PayChainSdk\Api\DocsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);

try {
    $result = $apiInstance->getOpenApiContract();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DocsApi->getOpenApiContract: ', $e->getMessage(), PHP_EOL;
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
