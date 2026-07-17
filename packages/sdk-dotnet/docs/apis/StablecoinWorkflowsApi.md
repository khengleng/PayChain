# PayChain.Sdk.Api.StablecoinWorkflowsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**CreateMintRequest**](StablecoinWorkflowsApi.md#createmintrequest) | **POST** /api/v1/stablecoins/{id}/mint-requests | Create a mint request |
| [**CreateRedemptionRequest**](StablecoinWorkflowsApi.md#createredemptionrequest) | **POST** /api/v1/stablecoins/{id}/redemptions | Create a redemption request |
| [**QuoteConversion**](StablecoinWorkflowsApi.md#quoteconversion) | **POST** /api/v1/conversions/quote | Quote a loyalty to stablecoin conversion |

<a id="createmintrequest"></a>
# **CreateMintRequest**
> Dictionary&lt;string, Object&gt; CreateMintRequest (string id, string idempotencyKey, MintRequest mintRequest, Guid xCorrelationId = null)

Create a mint request


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** |  |  |
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **mintRequest** | [**MintRequest**](MintRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

**Dictionary<string, Object>**

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Mint workflow record |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="createredemptionrequest"></a>
# **CreateRedemptionRequest**
> Dictionary&lt;string, Object&gt; CreateRedemptionRequest (string id, string idempotencyKey, RedemptionRequest redemptionRequest, Guid xCorrelationId = null)

Create a redemption request


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **id** | **string** |  |  |
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **redemptionRequest** | [**RedemptionRequest**](RedemptionRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

**Dictionary<string, Object>**

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Redemption workflow record |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="quoteconversion"></a>
# **QuoteConversion**
> Dictionary&lt;string, Object&gt; QuoteConversion (string idempotencyKey, ConversionQuoteRequest conversionQuoteRequest, Guid xCorrelationId = null)

Quote a loyalty to stablecoin conversion


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **conversionQuoteRequest** | [**ConversionQuoteRequest**](ConversionQuoteRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

**Dictionary<string, Object>**

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Conversion quote |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

