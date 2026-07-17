# PayChainSdk\WalletsApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createWallet()**](WalletsApi.md#createWallet) | **POST** /api/v1/wallets | Create a managed custodial wallet |
| [**getWallet()**](WalletsApi.md#getWallet) | **GET** /api/v1/wallets/{walletId} | Get a wallet |
| [**listWalletBalances()**](WalletsApi.md#listWalletBalances) | **GET** /api/v1/wallets/{walletId}/balances | List wallet balances |


## `createWallet()`

```php
createWallet($idempotencyKey, $createWalletRequest, $xCorrelationId): \PayChainSdk\Model\Wallet
```

Create a managed custodial wallet

Creates the Stellar account and records the wallet under the caller tenant.

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\WalletsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$createWalletRequest = new \PayChainSdk\Model\CreateWalletRequest(); // \PayChainSdk\Model\CreateWalletRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->createWallet($idempotencyKey, $createWalletRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling WalletsApi->createWallet: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **createWalletRequest** | [**\PayChainSdk\Model\CreateWalletRequest**](../Model/CreateWalletRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Wallet**](../Model/Wallet.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `getWallet()`

```php
getWallet($walletId, $xCorrelationId): \PayChainSdk\Model\Wallet
```

Get a wallet

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\WalletsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$walletId = 'walletId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->getWallet($walletId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling WalletsApi->getWallet: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **walletId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Wallet**](../Model/Wallet.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `listWalletBalances()`

```php
listWalletBalances($walletId, $xCorrelationId): \PayChainSdk\Model\Balance[]
```

List wallet balances

Refreshes the rebuildable balance read model from chain before returning balances.

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\WalletsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$walletId = 'walletId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->listWalletBalances($walletId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling WalletsApi->listWalletBalances: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **walletId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Balance[]**](../Model/Balance.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
