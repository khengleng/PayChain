# PayChainSdk\StablecoinWorkflowsApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createMintRequest()**](StablecoinWorkflowsApi.md#createMintRequest) | **POST** /api/v1/stablecoins/{id}/mint-requests | Create a mint request |
| [**createRedemptionRequest()**](StablecoinWorkflowsApi.md#createRedemptionRequest) | **POST** /api/v1/stablecoins/{id}/redemptions | Create a redemption request |
| [**quoteConversion()**](StablecoinWorkflowsApi.md#quoteConversion) | **POST** /api/v1/conversions/quote | Quote a loyalty to stablecoin conversion |


## `createMintRequest()`

```php
createMintRequest($id, $idempotencyKey, $mintRequest, $xCorrelationId): array<string,mixed>
```

Create a mint request

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinWorkflowsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$id = 'id_example'; // string
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$mintRequest = new \PayChainSdk\Model\MintRequest(); // \PayChainSdk\Model\MintRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->createMintRequest($id, $idempotencyKey, $mintRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinWorkflowsApi->createMintRequest: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **string**|  | |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **mintRequest** | [**\PayChainSdk\Model\MintRequest**](../Model/MintRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

**array<string,mixed>**

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `createRedemptionRequest()`

```php
createRedemptionRequest($id, $idempotencyKey, $redemptionRequest, $xCorrelationId): array<string,mixed>
```

Create a redemption request

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinWorkflowsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$id = 'id_example'; // string
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$redemptionRequest = new \PayChainSdk\Model\RedemptionRequest(); // \PayChainSdk\Model\RedemptionRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->createRedemptionRequest($id, $idempotencyKey, $redemptionRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinWorkflowsApi->createRedemptionRequest: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **string**|  | |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **redemptionRequest** | [**\PayChainSdk\Model\RedemptionRequest**](../Model/RedemptionRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

**array<string,mixed>**

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `quoteConversion()`

```php
quoteConversion($idempotencyKey, $conversionQuoteRequest, $xCorrelationId): array<string,mixed>
```

Quote a loyalty to stablecoin conversion

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinWorkflowsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$conversionQuoteRequest = new \PayChainSdk\Model\ConversionQuoteRequest(); // \PayChainSdk\Model\ConversionQuoteRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->quoteConversion($idempotencyKey, $conversionQuoteRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinWorkflowsApi->quoteConversion: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **conversionQuoteRequest** | [**\PayChainSdk\Model\ConversionQuoteRequest**](../Model/ConversionQuoteRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

**array<string,mixed>**

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
