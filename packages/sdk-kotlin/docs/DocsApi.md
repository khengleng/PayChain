# DocsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**getOpenApiContract**](DocsApi.md#getOpenApiContract) | **GET** /api/v1/openapi.json | Get the machine-readable OpenAPI contract |


<a id="getOpenApiContract"></a>
# **getOpenApiContract**
> kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt; getOpenApiContract()

Get the machine-readable OpenAPI contract

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = DocsApi()
try {
    val result : kotlin.collections.Map<kotlin.String, kotlin.Any> = apiInstance.getOpenApiContract()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling DocsApi#getOpenApiContract")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling DocsApi#getOpenApiContract")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt;**](kotlin.Any.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

