# PayChainSdk\TransactionsApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**approveCompensation()**](TransactionsApi.md#approveCompensation) | **POST** /api/v1/transactions/compensations/{compensationId}/approve | Approve a pending compensation |
| [**createCompensation()**](TransactionsApi.md#createCompensation) | **POST** /api/v1/transactions/{transactionId}/compensate | Create a compensating transaction |
| [**getTransaction()**](TransactionsApi.md#getTransaction) | **GET** /api/v1/transactions/{transactionId} | Get a transaction |
| [**listTransactions()**](TransactionsApi.md#listTransactions) | **GET** /api/v1/transactions | List transactions |


## `approveCompensation()`

```php
approveCompensation($compensationId, $xCorrelationId): \PayChainSdk\Model\Compensation
```

Approve a pending compensation

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\TransactionsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$compensationId = 'compensationId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->approveCompensation($compensationId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionsApi->approveCompensation: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **compensationId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Compensation**](../Model/Compensation.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `createCompensation()`

```php
createCompensation($transactionId, $idempotencyKey, $compensationRequest, $xCorrelationId): \PayChainSdk\Model\Compensation
```

Create a compensating transaction

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\TransactionsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$transactionId = 'transactionId_example'; // string
$idempotencyKey = 'idempotencyKey_example'; // string | Required on replay-safe writes so retries cannot double-apply.
$compensationRequest = new \PayChainSdk\Model\CompensationRequest(); // \PayChainSdk\Model\CompensationRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->createCompensation($transactionId, $idempotencyKey, $compensationRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionsApi->createCompensation: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **transactionId** | **string**|  | |
| **idempotencyKey** | **string**| Required on replay-safe writes so retries cannot double-apply. | |
| **compensationRequest** | [**\PayChainSdk\Model\CompensationRequest**](../Model/CompensationRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Compensation**](../Model/Compensation.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `getTransaction()`

```php
getTransaction($transactionId, $xCorrelationId): \PayChainSdk\Model\Transaction
```

Get a transaction

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\TransactionsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$transactionId = 'transactionId_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->getTransaction($transactionId, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionsApi->getTransaction: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **transactionId** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Transaction**](../Model/Transaction.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `listTransactions()`

```php
listTransactions($limit, $xCorrelationId): \PayChainSdk\Model\Transaction[]
```

List transactions

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\TransactionsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$limit = 50; // int | Maximum number of rows to return. The API caps this at 200.
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->listTransactions($limit, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionsApi->listTransactions: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **limit** | **int**| Maximum number of rows to return. The API caps this at 200. | [optional] [default to 50] |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\Transaction[]**](../Model/Transaction.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
