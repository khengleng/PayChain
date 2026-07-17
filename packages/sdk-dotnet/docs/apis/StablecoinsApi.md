# PayChain.Sdk.Api.StablecoinsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**ActivateStablecoin**](StablecoinsApi.md#activatestablecoin) | **POST** /api/v1/stablecoins/{stablecoinId}/activate | Activate a stablecoin |
| [**ApproveStablecoinGate**](StablecoinsApi.md#approvestablecoingate) | **POST** /api/v1/stablecoins/{stablecoinId}/approve-gate | Approve a stablecoin gate |
| [**CreateStablecoin**](StablecoinsApi.md#createstablecoin) | **POST** /api/v1/stablecoins | Create a stablecoin control-plane record |
| [**GetStablecoin**](StablecoinsApi.md#getstablecoin) | **GET** /api/v1/stablecoins/{stablecoinId} | Get a stablecoin |
| [**ListStablecoins**](StablecoinsApi.md#liststablecoins) | **GET** /api/v1/stablecoins | List stablecoins |
| [**SubmitStablecoinForReview**](StablecoinsApi.md#submitstablecoinforreview) | **POST** /api/v1/stablecoins/{stablecoinId}/submit-for-review | Submit a stablecoin for review |
| [**SuspendStablecoin**](StablecoinsApi.md#suspendstablecoin) | **POST** /api/v1/stablecoins/{stablecoinId}/suspend | Suspend stablecoin minting, redemption, or both |

<a id="activatestablecoin"></a>
# **ActivateStablecoin**
> Stablecoin ActivateStablecoin (string stablecoinId, Guid xCorrelationId = null)

Activate a stablecoin


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **stablecoinId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated stablecoin |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="approvestablecoingate"></a>
# **ApproveStablecoinGate**
> Stablecoin ApproveStablecoinGate (string stablecoinId, ApproveStablecoinGateRequest approveStablecoinGateRequest, Guid xCorrelationId = null)

Approve a stablecoin gate


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **stablecoinId** | **string** |  |  |
| **approveStablecoinGateRequest** | [**ApproveStablecoinGateRequest**](ApproveStablecoinGateRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated stablecoin |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="createstablecoin"></a>
# **CreateStablecoin**
> Stablecoin CreateStablecoin (string idempotencyKey, CreateStablecoinRequest createStablecoinRequest, Guid xCorrelationId = null)

Create a stablecoin control-plane record

Feature-flag gated; public issuance remains disabled until readiness gates pass.


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **createStablecoinRequest** | [**CreateStablecoinRequest**](CreateStablecoinRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Created stablecoin |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="getstablecoin"></a>
# **GetStablecoin**
> Stablecoin GetStablecoin (string stablecoinId, Guid xCorrelationId = null)

Get a stablecoin


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **stablecoinId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Stablecoin |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="liststablecoins"></a>
# **ListStablecoins**
> List&lt;Stablecoin&gt; ListStablecoins (Guid xCorrelationId = null)

List stablecoins

Stablecoin features are disabled by default until readiness gates pass.


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**List&lt;Stablecoin&gt;**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Stablecoins |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="submitstablecoinforreview"></a>
# **SubmitStablecoinForReview**
> Stablecoin SubmitStablecoinForReview (string stablecoinId, Guid xCorrelationId = null)

Submit a stablecoin for review


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **stablecoinId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated stablecoin |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="suspendstablecoin"></a>
# **SuspendStablecoin**
> Stablecoin SuspendStablecoin (string stablecoinId, SuspendStablecoinRequest suspendStablecoinRequest, Guid xCorrelationId = null)

Suspend stablecoin minting, redemption, or both


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **stablecoinId** | **string** |  |  |
| **suspendStablecoinRequest** | [**SuspendStablecoinRequest**](SuspendStablecoinRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Stablecoin**](Stablecoin.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated stablecoin |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

