# PayChain.Sdk.Api.AuthApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**IssueAccessToken**](AuthApi.md#issueaccesstoken) | **POST** /api/v1/oauth/token | Exchange client credentials for a bearer token |

<a id="issueaccesstoken"></a>
# **IssueAccessToken**
> TokenResponse IssueAccessToken (TokenRequest tokenRequest)

Exchange client credentials for a bearer token


### Parameters

| Name | Type | Description | Notes |
|------|------|-------------|-------|
| **tokenRequest** | [**TokenRequest**](TokenRequest.md) |  |  |

### Return type

[**TokenResponse**](TokenResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Issued access token |  -  |
| **400** | Validation error |  -  |
| **401** | Invalid credentials |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

