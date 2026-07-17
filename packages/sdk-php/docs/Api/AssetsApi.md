# PayChainSdk\AssetsApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**activateAsset()**](AssetsApi.md#activateAsset) | **POST** /api/v1/assets/{assetId}/activate | Activate an asset |
| [**burnAsset()**](AssetsApi.md#burnAsset) | **POST** /api/v1/assets/{assetId}/burn | Burn loyalty value |
| [**createAsset()**](AssetsApi.md#createAsset) | **POST** /api/v1/assets | Create an asset |
| [**earnAsset()**](AssetsApi.md#earnAsset) | **POST** /api/v1/assets/{assetId}/earn | Evaluate earn rules and award points |
| [**getAsset()**](AssetsApi.md#getAsset) | **GET** /api/v1/assets/{assetId} | Get an asset |
| [**issueAsset()**](AssetsApi.md#issueAsset) | **POST** /api/v1/assets/{assetId}/issue | Issue loyalty value |
| [**listAssets()**](AssetsApi.md#listAssets) | **GET** /api/v1/assets | List assets |
| [**redeemAsset()**](AssetsApi.md#redeemAsset) | **POST** /api/v1/assets/{assetId}/redeem | Redeem loyalty value |
| [**transferAsset()**](AssetsApi.md#transferAsset) | **POST** /api/v1/assets/{assetId}/transfer | Transfer loyalty value |


## `activateAsset()`

```php
activateAsset($assetId, $xCorrelationId): \PayChainSdk\Model\Asset
```

Activate an asset

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$assetId = 'assetId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->activateAsset($assetId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->activateAsset: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **assetId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Asset**](../Model/Asset.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `burnAsset()`

```php
burnAsset($assetId, $idempotencyKey, $burnRequest, $xCorrelationId): \PayChainSdk\Model\TransactionRecord
```

Burn loyalty value

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$assetId = 'assetId_example'; // string
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$burnRequest = new \PayChainSdk\Model\BurnRequest(); // \PayChainSdk\Model\BurnRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->burnAsset($assetId, $idempotencyKey, $burnRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->burnAsset: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **assetId** | **string**|  | |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **burnRequest** | [**\PayChainSdk\Model\BurnRequest**](../Model/BurnRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\TransactionRecord**](../Model/TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `createAsset()`

```php
createAsset($idempotencyKey, $createAssetRequest, $xCorrelationId): \PayChainSdk\Model\Asset
```

Create an asset

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$createAssetRequest = new \PayChainSdk\Model\CreateAssetRequest(); // \PayChainSdk\Model\CreateAssetRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->createAsset($idempotencyKey, $createAssetRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->createAsset: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **createAssetRequest** | [**\PayChainSdk\Model\CreateAssetRequest**](../Model/CreateAssetRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Asset**](../Model/Asset.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `earnAsset()`

```php
earnAsset($assetId, $idempotencyKey, $earnRequest, $xCorrelationId): \PayChainSdk\Model\TransactionRecord
```

Evaluate earn rules and award points

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$assetId = 'assetId_example'; // string
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$earnRequest = new \PayChainSdk\Model\EarnRequest(); // \PayChainSdk\Model\EarnRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->earnAsset($assetId, $idempotencyKey, $earnRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->earnAsset: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **assetId** | **string**|  | |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **earnRequest** | [**\PayChainSdk\Model\EarnRequest**](../Model/EarnRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\TransactionRecord**](../Model/TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `getAsset()`

```php
getAsset($assetId, $xCorrelationId): \PayChainSdk\Model\Asset
```

Get an asset

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$assetId = 'assetId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->getAsset($assetId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->getAsset: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **assetId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Asset**](../Model/Asset.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `issueAsset()`

```php
issueAsset($assetId, $idempotencyKey, $issueRequest, $xCorrelationId): \PayChainSdk\Model\TransactionRecord
```

Issue loyalty value

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$assetId = 'assetId_example'; // string
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$issueRequest = new \PayChainSdk\Model\IssueRequest(); // \PayChainSdk\Model\IssueRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->issueAsset($assetId, $idempotencyKey, $issueRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->issueAsset: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **assetId** | **string**|  | |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **issueRequest** | [**\PayChainSdk\Model\IssueRequest**](../Model/IssueRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\TransactionRecord**](../Model/TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `listAssets()`

```php
listAssets($xCorrelationId): \PayChainSdk\Model\Asset[]
```

List assets

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->listAssets($xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->listAssets: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Asset[]**](../Model/Asset.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `redeemAsset()`

```php
redeemAsset($assetId, $idempotencyKey, $redeemRequest, $xCorrelationId): \PayChainSdk\Model\TransactionRecord
```

Redeem loyalty value

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$assetId = 'assetId_example'; // string
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$redeemRequest = new \PayChainSdk\Model\RedeemRequest(); // \PayChainSdk\Model\RedeemRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->redeemAsset($assetId, $idempotencyKey, $redeemRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->redeemAsset: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **assetId** | **string**|  | |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **redeemRequest** | [**\PayChainSdk\Model\RedeemRequest**](../Model/RedeemRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\TransactionRecord**](../Model/TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `transferAsset()`

```php
transferAsset($assetId, $idempotencyKey, $transferRequest, $xCorrelationId): \PayChainSdk\Model\TransactionRecord
```

Transfer loyalty value

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\AssetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$assetId = 'assetId_example'; // string
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$transferRequest = new \PayChainSdk\Model\TransferRequest(); // \PayChainSdk\Model\TransferRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->transferAsset($assetId, $idempotencyKey, $transferRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AssetsApi->transferAsset: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **assetId** | **string**|  | |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **transferRequest** | [**\PayChainSdk\Model\TransferRequest**](../Model/TransferRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\TransactionRecord**](../Model/TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
