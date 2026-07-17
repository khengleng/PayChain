# PayChain.Sdk.Api.AssetsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**ActivateAsset**](AssetsApi.md#activateasset) | **POST** /api/v1/assets/{assetId}/activate | Activate an asset |
| [**BurnAsset**](AssetsApi.md#burnasset) | **POST** /api/v1/assets/{assetId}/burn | Burn loyalty value |
| [**CreateAsset**](AssetsApi.md#createasset) | **POST** /api/v1/assets | Create an asset |
| [**EarnAsset**](AssetsApi.md#earnasset) | **POST** /api/v1/assets/{assetId}/earn | Evaluate earn rules and award points |
| [**GetAsset**](AssetsApi.md#getasset) | **GET** /api/v1/assets/{assetId} | Get an asset |
| [**IssueAsset**](AssetsApi.md#issueasset) | **POST** /api/v1/assets/{assetId}/issue | Issue loyalty value |
| [**ListAssets**](AssetsApi.md#listassets) | **GET** /api/v1/assets | List assets |
| [**RedeemAsset**](AssetsApi.md#redeemasset) | **POST** /api/v1/assets/{assetId}/redeem | Redeem loyalty value |
| [**TransferAsset**](AssetsApi.md#transferasset) | **POST** /api/v1/assets/{assetId}/transfer | Transfer loyalty value |

<a id="activateasset"></a>
# **ActivateAsset**
> Asset ActivateAsset (string assetId, Guid xCorrelationId = null)

Activate an asset


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **assetId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Asset**](Asset.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Activated asset |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="burnasset"></a>
# **BurnAsset**
> TransactionRecord BurnAsset (string assetId, string idempotencyKey, BurnRequest burnRequest, Guid xCorrelationId = null)

Burn loyalty value


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **assetId** | **string** |  |  |
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **burnRequest** | [**BurnRequest**](BurnRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Burn transaction |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="createasset"></a>
# **CreateAsset**
> Asset CreateAsset (string idempotencyKey, CreateAssetRequest createAssetRequest, Guid xCorrelationId = null)

Create an asset


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **createAssetRequest** | [**CreateAssetRequest**](CreateAssetRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Asset**](Asset.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Created asset |  -  |
| **409** | Asset code conflict |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="earnasset"></a>
# **EarnAsset**
> TransactionRecord EarnAsset (string assetId, string idempotencyKey, EarnRequest earnRequest, Guid xCorrelationId = null)

Evaluate earn rules and award points


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **assetId** | **string** |  |  |
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **earnRequest** | [**EarnRequest**](EarnRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Earn transaction |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="getasset"></a>
# **GetAsset**
> Asset GetAsset (string assetId, Guid xCorrelationId = null)

Get an asset


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **assetId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Asset**](Asset.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Asset |  -  |
| **404** | Asset not found |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="issueasset"></a>
# **IssueAsset**
> TransactionRecord IssueAsset (string assetId, string idempotencyKey, IssueRequest issueRequest, Guid xCorrelationId = null)

Issue loyalty value


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **assetId** | **string** |  |  |
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **issueRequest** | [**IssueRequest**](IssueRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Issued transaction |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="listassets"></a>
# **ListAssets**
> List&lt;Asset&gt; ListAssets (Guid xCorrelationId = null)

List assets


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**List&lt;Asset&gt;**](Asset.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Assets |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="redeemasset"></a>
# **RedeemAsset**
> TransactionRecord RedeemAsset (string assetId, string idempotencyKey, RedeemRequest redeemRequest, Guid xCorrelationId = null)

Redeem loyalty value


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **assetId** | **string** |  |  |
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **redeemRequest** | [**RedeemRequest**](RedeemRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Redemption transaction |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="transferasset"></a>
# **TransferAsset**
> TransactionRecord TransferAsset (string assetId, string idempotencyKey, TransferRequest transferRequest, Guid xCorrelationId = null)

Transfer loyalty value


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **assetId** | **string** |  |  |
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **transferRequest** | [**TransferRequest**](TransferRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**TransactionRecord**](TransactionRecord.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Transfer transaction |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

