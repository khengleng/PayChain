# AuthApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**issueAccessToken**](AuthApi.md#issueAccessToken) | **POST** /api/v1/oauth/token | Exchange client credentials for a bearer token |


<a id="issueAccessToken"></a>
# **issueAccessToken**
> TokenResponse issueAccessToken(tokenRequest)

Exchange client credentials for a bearer token

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AuthApi()
val tokenRequest : TokenRequest =  // TokenRequest | 
try {
    val result : TokenResponse = apiInstance.issueAccessToken(tokenRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AuthApi#issueAccessToken")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AuthApi#issueAccessToken")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **tokenRequest** | [**TokenRequest**](TokenRequest.md)|  | |

### Return type

[**TokenResponse**](TokenResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

