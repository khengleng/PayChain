# PayChainSdk\WebhooksApi

All URIs are relative to https://api.paychain.cambobia.com, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createWebhook()**](WebhooksApi.md#createWebhook) | **POST** /api/v1/webhooks | Register a webhook endpoint |
| [**disableWebhook()**](WebhooksApi.md#disableWebhook) | **DELETE** /api/v1/webhooks/{id} | Disable a webhook endpoint |
| [**listWebhooks()**](WebhooksApi.md#listWebhooks) | **GET** /api/v1/webhooks | List webhook endpoints |
| [**rotateWebhookSecret()**](WebhooksApi.md#rotateWebhookSecret) | **POST** /api/v1/webhooks/{id}/rotate-secret | Rotate webhook signing secret |


## `createWebhook()`

```php
createWebhook($webhookCreateRequest, $xCorrelationId): \PayChainSdk\Model\WebhookEndpointWithSecret
```

Register a webhook endpoint

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\WebhooksApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$webhookCreateRequest = new \PayChainSdk\Model\WebhookCreateRequest(); // \PayChainSdk\Model\WebhookCreateRequest
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->createWebhook($webhookCreateRequest, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling WebhooksApi->createWebhook: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **webhookCreateRequest** | [**\PayChainSdk\Model\WebhookCreateRequest**](../Model/WebhookCreateRequest.md)|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\WebhookEndpointWithSecret**](../Model/WebhookEndpointWithSecret.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `disableWebhook()`

```php
disableWebhook($id, $xCorrelationId)
```

Disable a webhook endpoint

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\WebhooksApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$id = 'id_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $apiInstance->disableWebhook($id, $xCorrelationId);
} catch (Exception $e) {
    echo 'Exception when calling WebhooksApi->disableWebhook: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

void (empty response body)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `listWebhooks()`

```php
listWebhooks($xCorrelationId): \PayChainSdk\Model\WebhookEndpoint[]
```

List webhook endpoints

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\WebhooksApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->listWebhooks($xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling WebhooksApi->listWebhooks: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\WebhookEndpoint[]**](../Model/WebhookEndpoint.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `rotateWebhookSecret()`

```php
rotateWebhookSecret($id, $xCorrelationId): \PayChainSdk\Model\WebhookEndpointWithSecret
```

Rotate webhook signing secret

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');


// Configure OAuth2 access token for authorization: oauth2ClientCredentials
$config = PayChainSdk\Configuration::getDefaultConfiguration()->setAccessToken('YOUR_ACCESS_TOKEN');


$apiInstance = new PayChainSdk\Api\WebhooksApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$id = 'id_example'; // string
$xCorrelationId = 'xCorrelationId_example'; // string | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    $result = $apiInstance->rotateWebhookSecret($id, $xCorrelationId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling WebhooksApi->rotateWebhookSecret: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **id** | **string**|  | |
| **xCorrelationId** | **string**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**\PayChainSdk\Model\WebhookEndpointWithSecret**](../Model/WebhookEndpointWithSecret.md)

### Authorization

[oauth2ClientCredentials](../../README.md#oauth2ClientCredentials)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
