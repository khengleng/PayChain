# PayChain.Sdk.Api.WebhooksApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**CreateWebhook**](WebhooksApi.md#createwebhook) | **POST** /api/v1/webhooks | Register a webhook endpoint |
| [**DisableWebhook**](WebhooksApi.md#disablewebhook) | **DELETE** /api/v1/webhooks/{id} | Disable a webhook endpoint |
| [**ListWebhooks**](WebhooksApi.md#listwebhooks) | **GET** /api/v1/webhooks | List webhook endpoints |
| [**RotateWebhookSecret**](WebhooksApi.md#rotatewebhooksecret) | **POST** /api/v1/webhooks/{id}/rotate-secret | Rotate webhook signing secret |

<a id="createwebhook"></a>
# **CreateWebhook**
> WebhookEndpointWithSecret CreateWebhook (WebhookCreateRequest webhookCreateRequest, Guid xCorrelationId = null)

Register a webhook endpoint


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **webhookCreateRequest** | [**WebhookCreateRequest**](WebhookCreateRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**WebhookEndpointWithSecret**](WebhookEndpointWithSecret.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Created endpoint plus one-time secret |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="disablewebhook"></a>
# **DisableWebhook**
> void DisableWebhook (string id, Guid xCorrelationId = null)

Disable a webhook endpoint


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

void (empty response body)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Webhook disabled |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="listwebhooks"></a>
# **ListWebhooks**
> List&lt;WebhookEndpoint&gt; ListWebhooks (Guid xCorrelationId = null)

List webhook endpoints


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**List&lt;WebhookEndpoint&gt;**](WebhookEndpoint.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Webhook endpoints |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="rotatewebhooksecret"></a>
# **RotateWebhookSecret**
> WebhookEndpointWithSecret RotateWebhookSecret (string id, Guid xCorrelationId = null)

Rotate webhook signing secret


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**WebhookEndpointWithSecret**](WebhookEndpointWithSecret.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Endpoint plus new one-time secret |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

