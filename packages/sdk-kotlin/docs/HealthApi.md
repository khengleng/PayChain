# HealthApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**getBlockchainHealth**](HealthApi.md#getBlockchainHealth) | **GET** /api/v1/health/blockchain | Blockchain provider health |
| [**getHealth**](HealthApi.md#getHealth) | **GET** /api/v1/health | Liveness probe |
| [**getReadiness**](HealthApi.md#getReadiness) | **GET** /api/v1/health/ready | Readiness probe |


<a id="getBlockchainHealth"></a>
# **getBlockchainHealth**
> kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt; getBlockchainHealth()

Blockchain provider health

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = HealthApi()
try {
    val result : kotlin.collections.Map<kotlin.String, kotlin.Any> = apiInstance.getBlockchainHealth()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling HealthApi#getBlockchainHealth")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling HealthApi#getBlockchainHealth")
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

<a id="getHealth"></a>
# **getHealth**
> Health getHealth()

Liveness probe

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = HealthApi()
try {
    val result : Health = apiInstance.getHealth()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling HealthApi#getHealth")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling HealthApi#getHealth")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**Health**](Health.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="getReadiness"></a>
# **getReadiness**
> HealthReady getReadiness()

Readiness probe

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = HealthApi()
try {
    val result : HealthReady = apiInstance.getReadiness()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling HealthApi#getReadiness")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling HealthApi#getReadiness")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**HealthReady**](HealthReady.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

