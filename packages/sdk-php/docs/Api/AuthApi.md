# PayChainSdk\AuthApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**issueAccessToken()**](AuthApi.md#issueAccessToken) | **POST** /api/v1/oauth/token | Exchange client credentials for a bearer token |


## `issueAccessToken()`

```php
issueAccessToken($tokenRequest): \PayChainSdk\Model\TokenResponse
```

Exchange client credentials for a bearer token

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');



$apiInstance = new PayChainSdk\Api\AuthApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);
$tokenRequest = new \PayChainSdk\Model\TokenRequest(); // \PayChainSdk\Model\TokenRequest

try {
    $result = $apiInstance->issueAccessToken($tokenRequest);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AuthApi->issueAccessToken: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **tokenRequest** | [**\PayChainSdk\Model\TokenRequest**](../Model/TokenRequest.md)|  | |

### Return type

[**\PayChainSdk\Model\TokenResponse**](../Model/TokenResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
