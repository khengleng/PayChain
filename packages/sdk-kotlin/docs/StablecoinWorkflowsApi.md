# StablecoinWorkflowsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createMintRequest**](StablecoinWorkflowsApi.md#createMintRequest) | **POST** /api/v1/stablecoins/{id}/mint-requests | Create a mint request |
| [**createRedemptionRequest**](StablecoinWorkflowsApi.md#createRedemptionRequest) | **POST** /api/v1/stablecoins/{id}/redemptions | Create a redemption request |
| [**quoteConversion**](StablecoinWorkflowsApi.md#quoteConversion) | **POST** /api/v1/conversions/quote | Quote a loyalty to stablecoin conversion |


<a id="createMintRequest"></a>
# **createMintRequest**
> kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt; createMintRequest(id, idempotencyKey, mintRequest, xCorrelationId)

Create a mint request

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinWorkflowsApi()
val id : kotlin.String = id_example // kotlin.String | 
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val mintRequest : MintRequest =  // MintRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : kotlin.collections.Map<kotlin.String, kotlin.Any> = apiInstance.createMintRequest(id, idempotencyKey, mintRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinWorkflowsApi#createMintRequest")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinWorkflowsApi#createMintRequest")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.String**|  | |
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **mintRequest** | [**MintRequest**](MintRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt;**](kotlin.Any.md)

### Authorization


Configure oauth2ClientCredentials statically:
```kotlin
ApiClient.accessToken = ""
```
Configure oauth2ClientCredentials dynamically:
```kotlin
apiInstance.accessTokenProvider = { "" }
```

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="createRedemptionRequest"></a>
# **createRedemptionRequest**
> kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt; createRedemptionRequest(id, idempotencyKey, redemptionRequest, xCorrelationId)

Create a redemption request

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinWorkflowsApi()
val id : kotlin.String = id_example // kotlin.String | 
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val redemptionRequest : RedemptionRequest =  // RedemptionRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : kotlin.collections.Map<kotlin.String, kotlin.Any> = apiInstance.createRedemptionRequest(id, idempotencyKey, redemptionRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinWorkflowsApi#createRedemptionRequest")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinWorkflowsApi#createRedemptionRequest")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.String**|  | |
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **redemptionRequest** | [**RedemptionRequest**](RedemptionRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt;**](kotlin.Any.md)

### Authorization


Configure oauth2ClientCredentials statically:
```kotlin
ApiClient.accessToken = ""
```
Configure oauth2ClientCredentials dynamically:
```kotlin
apiInstance.accessTokenProvider = { "" }
```

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="quoteConversion"></a>
# **quoteConversion**
> kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt; quoteConversion(idempotencyKey, conversionQuoteRequest, xCorrelationId)

Quote a loyalty to stablecoin conversion

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinWorkflowsApi()
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val conversionQuoteRequest : ConversionQuoteRequest =  // ConversionQuoteRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : kotlin.collections.Map<kotlin.String, kotlin.Any> = apiInstance.quoteConversion(idempotencyKey, conversionQuoteRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinWorkflowsApi#quoteConversion")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinWorkflowsApi#quoteConversion")
    e.printStackTrace()
}
```

### Parameters
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **conversionQuoteRequest** | [**ConversionQuoteRequest**](ConversionQuoteRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**kotlin.collections.Map&lt;kotlin.String, kotlin.Any&gt;**](kotlin.Any.md)

### Authorization


Configure oauth2ClientCredentials statically:
```kotlin
ApiClient.accessToken = ""
```
Configure oauth2ClientCredentials dynamically:
```kotlin
apiInstance.accessTokenProvider = { "" }
```

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

