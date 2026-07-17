# PayChain.Sdk.Api.TransactionsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**ApproveCompensation**](TransactionsApi.md#approvecompensation) | **POST** /api/v1/transactions/compensations/{compensationId}/approve | Approve a pending compensation |
| [**CreateCompensation**](TransactionsApi.md#createcompensation) | **POST** /api/v1/transactions/{transactionId}/compensate | Create a compensating transaction |
| [**GetTransaction**](TransactionsApi.md#gettransaction) | **GET** /api/v1/transactions/{transactionId} | Get a transaction |
| [**ListTransactions**](TransactionsApi.md#listtransactions) | **GET** /api/v1/transactions | List transactions |

<a id="approvecompensation"></a>
# **ApproveCompensation**
> Compensation ApproveCompensation (string compensationId, Guid xCorrelationId = null)

Approve a pending compensation


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **compensationId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Compensation**](Compensation.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Approved compensation |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="createcompensation"></a>
# **CreateCompensation**
> Compensation CreateCompensation (string transactionId, string idempotencyKey, CompensationRequest compensationRequest, Guid xCorrelationId = null)

Create a compensating transaction


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **transactionId** | **string** |  |  |
| **idempotencyKey** | **string** | Required on replay-safe writes so retries cannot double-apply. |  |
| **compensationRequest** | [**CompensationRequest**](CompensationRequest.md) |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Compensation**](Compensation.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Compensation record |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="gettransaction"></a>
# **GetTransaction**
> Transaction GetTransaction (string transactionId, Guid xCorrelationId = null)

Get a transaction


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **transactionId** | **string** |  |  |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**Transaction**](Transaction.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Transaction |  -  |
| **404** | Transaction not found |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="listtransactions"></a>
# **ListTransactions**
> List&lt;Transaction&gt; ListTransactions (int limit = null, Guid xCorrelationId = null)

List transactions


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **limit** | **int** | Maximum number of rows to return. The API caps this at 200. | [optional] [default to 50] |
| **xCorrelationId** | **Guid** | Optional caller-supplied correlation id echoed through logs and audit records. | [optional]  |

### Return type

[**List&lt;Transaction&gt;**](Transaction.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Transactions |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

