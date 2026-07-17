# PayChain.Sdk.Api.HealthApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
|--------|--------------|-------------|
| [**GetBlockchainHealth**](HealthApi.md#getblockchainhealth) | **GET** /api/v1/health/blockchain | Blockchain provider health |
| [**GetHealth**](HealthApi.md#gethealth) | **GET** /api/v1/health | Liveness probe |
| [**GetReadiness**](HealthApi.md#getreadiness) | **GET** /api/v1/health/ready | Readiness probe |

<a id="getblockchainhealth"></a>
# **GetBlockchainHealth**
> Dictionary&lt;string, Object&gt; GetBlockchainHealth ()

Blockchain provider health


### Parameters
This endpoint does not need any parameter.
### Return type

**Dictionary<string, Object>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Blockchain provider state |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="gethealth"></a>
# **GetHealth**
> Health GetHealth ()

Liveness probe


### Parameters
This endpoint does not need any parameter.
### Return type

[**Health**](Health.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | API live |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

<a id="getreadiness"></a>
# **GetReadiness**
> HealthReady GetReadiness ()

Readiness probe


### Parameters
This endpoint does not need any parameter.
### Return type

[**HealthReady**](HealthReady.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Readiness state |  -  |

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

