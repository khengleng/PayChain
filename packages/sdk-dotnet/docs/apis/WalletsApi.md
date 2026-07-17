# PayChain.Sdk.Api.WalletsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**CreateWallet**](WalletsApi.md#createwallet) | **POST** /api/v1/wallets | Create a managed custodial wallet |
| [**GetWallet**](WalletsApi.md#getwallet) | **GET** /api/v1/wallets/{walletId} | Get a wallet |
| [**ListWalletBalances**](WalletsApi.md#listwalletbalances) | **GET** /api/v1/wallets/{walletId}/balances | List wallet balances |

<a id="createwallet"></a>
# **CreateWallet**
> Wallet CreateWallet (string idempotencyKey, CreateWalletRequest createWalletRequest, Guid xCorrelationId = null)

Create a managed custodial wallet

Creates the Stellar account and records the wallet under the caller tenant.


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **createWalletRequest** | [**CreateWalletRequest**](CreateWalletRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Wallet**](Wallet.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Created wallet |  -  |
| **400** | Validation error |  -  |
| **401** | Unauthorized |  -  |
| **403** | Missing scope |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="getwallet"></a>
# **GetWallet**
> Wallet GetWallet (string walletId, Guid xCorrelationId = null)

Get a wallet


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **walletId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Wallet**](Wallet.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Wallet |  -  |
| **404** | Wallet not found |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="listwalletbalances"></a>
# **ListWalletBalances**
> List&lt;Balance&gt; ListWalletBalances (string walletId, Guid xCorrelationId = null)

List wallet balances

Refreshes the rebuildable balance read model from chain before returning balances.


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **walletId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**List&lt;Balance&gt;**](Balance.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Balances |  -  |
| **404** | Wallet not found |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

