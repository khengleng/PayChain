# PayChainSdk\StablecoinsApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**activateStablecoin()**](StablecoinsApi.md#activateStablecoin) | **POST** /api/v1/stablecoins/{stablecoinId}/activate | Activate a stablecoin |
| [**approveStablecoinGate()**](StablecoinsApi.md#approveStablecoinGate) | **POST** /api/v1/stablecoins/{stablecoinId}/approve-gate | Approve a stablecoin gate |
| [**createStablecoin()**](StablecoinsApi.md#createStablecoin) | **POST** /api/v1/stablecoins | Create a stablecoin control-plane record |
| [**getStablecoin()**](StablecoinsApi.md#getStablecoin) | **GET** /api/v1/stablecoins/{stablecoinId} | Get a stablecoin |
| [**listStablecoins()**](StablecoinsApi.md#listStablecoins) | **GET** /api/v1/stablecoins | List stablecoins |
| [**submitStablecoinForReview()**](StablecoinsApi.md#submitStablecoinForReview) | **POST** /api/v1/stablecoins/{stablecoinId}/submit-for-review | Submit a stablecoin for review |
| [**suspendStablecoin()**](StablecoinsApi.md#suspendStablecoin) | **POST** /api/v1/stablecoins/{stablecoinId}/suspend | Suspend stablecoin minting, redemption, or both |


## `activateStablecoin()`

```php
activateStablecoin($stablecoinId, $xCorrelationId): \PayChainSdk\Model\Stablecoin
```

Activate a stablecoin

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$stablecoinId = 'stablecoinId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->activateStablecoin($stablecoinId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinsApi->activateStablecoin: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **stablecoinId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Stablecoin**](../Model/Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `approveStablecoinGate()`

```php
approveStablecoinGate($stablecoinId, $approveStablecoinGateRequest, $xCorrelationId): \PayChainSdk\Model\Stablecoin
```

Approve a stablecoin gate

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$stablecoinId = 'stablecoinId_example'; // string
$approveStablecoinGateRequest = new \PayChainSdk\Model\ApproveStablecoinGateRequest(); // \PayChainSdk\Model\ApproveStablecoinGateRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->approveStablecoinGate($stablecoinId, $approveStablecoinGateRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinsApi->approveStablecoinGate: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **stablecoinId** | **string**|  | |
| **approveStablecoinGateRequest** | [**\PayChainSdk\Model\ApproveStablecoinGateRequest**](../Model/ApproveStablecoinGateRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Stablecoin**](../Model/Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `createStablecoin()`

```php
createStablecoin($idempotencyKey, $createStablecoinRequest, $xCorrelationId): \PayChainSdk\Model\Stablecoin
```

Create a stablecoin control-plane record

Feature-flag gated; public issuance remains disabled until readiness gates pass.

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$createStablecoinRequest = new \PayChainSdk\Model\CreateStablecoinRequest(); // \PayChainSdk\Model\CreateStablecoinRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->createStablecoin($idempotencyKey, $createStablecoinRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinsApi->createStablecoin: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **createStablecoinRequest** | [**\PayChainSdk\Model\CreateStablecoinRequest**](../Model/CreateStablecoinRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Stablecoin**](../Model/Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `getStablecoin()`

```php
getStablecoin($stablecoinId, $xCorrelationId): \PayChainSdk\Model\Stablecoin
```

Get a stablecoin

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$stablecoinId = 'stablecoinId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->getStablecoin($stablecoinId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinsApi->getStablecoin: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **stablecoinId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Stablecoin**](../Model/Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `listStablecoins()`

```php
listStablecoins($xCorrelationId): \PayChainSdk\Model\Stablecoin[]
```

List stablecoins

Stablecoin features are disabled by default until readiness gates pass.

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->listStablecoins($xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinsApi->listStablecoins: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Stablecoin[]**](../Model/Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `submitStablecoinForReview()`

```php
submitStablecoinForReview($stablecoinId, $xCorrelationId): \PayChainSdk\Model\Stablecoin
```

Submit a stablecoin for review

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$stablecoinId = 'stablecoinId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->submitStablecoinForReview($stablecoinId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinsApi->submitStablecoinForReview: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **stablecoinId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Stablecoin**](../Model/Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `suspendStablecoin()`

```php
suspendStablecoin($stablecoinId, $suspendStablecoinRequest, $xCorrelationId): \PayChainSdk\Model\Stablecoin
```

Suspend stablecoin minting, redemption, or both

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\StablecoinsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$stablecoinId = 'stablecoinId_example'; // string
$suspendStablecoinRequest = new \PayChainSdk\Model\SuspendStablecoinRequest(); // \PayChainSdk\Model\SuspendStablecoinRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->suspendStablecoin($stablecoinId, $suspendStablecoinRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling StablecoinsApi->suspendStablecoin: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **stablecoinId** | **string**|  | |
| **suspendStablecoinRequest** | [**\PayChainSdk\Model\SuspendStablecoinRequest**](../Model/SuspendStablecoinRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Stablecoin**](../Model/Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
