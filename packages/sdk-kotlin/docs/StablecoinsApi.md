# StablecoinsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**activateStablecoin**](StablecoinsApi.md#activateStablecoin) | **POST** /api/v1/stablecoins/{stablecoinId}/activate | Activate a stablecoin |
| [**approveStablecoinGate**](StablecoinsApi.md#approveStablecoinGate) | **POST** /api/v1/stablecoins/{stablecoinId}/approve-gate | Approve a stablecoin gate |
| [**createStablecoin**](StablecoinsApi.md#createStablecoin) | **POST** /api/v1/stablecoins | Create a stablecoin control-plane record |
| [**getStablecoin**](StablecoinsApi.md#getStablecoin) | **GET** /api/v1/stablecoins/{stablecoinId} | Get a stablecoin |
| [**listStablecoins**](StablecoinsApi.md#listStablecoins) | **GET** /api/v1/stablecoins | List stablecoins |
| [**submitStablecoinForReview**](StablecoinsApi.md#submitStablecoinForReview) | **POST** /api/v1/stablecoins/{stablecoinId}/submit-for-review | Submit a stablecoin for review |
| [**suspendStablecoin**](StablecoinsApi.md#suspendStablecoin) | **POST** /api/v1/stablecoins/{stablecoinId}/suspend | Suspend stablecoin minting, redemption, or both |


<a id="activateStablecoin"></a>
# **activateStablecoin**
> Stablecoin activateStablecoin(stablecoinId, xCorrelationId)

Activate a stablecoin

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinsApi()
val stablecoinId : kotlin.String = stablecoinId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Stablecoin = apiInstance.activateStablecoin(stablecoinId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinsApi#activateStablecoin")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinsApi#activateStablecoin")
    e.printStackTrace()
}
```

### Parameters
| **stablecoinId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Stablecoin**](Stablecoin.md)

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

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="approveStablecoinGate"></a>
# **approveStablecoinGate**
> Stablecoin approveStablecoinGate(stablecoinId, approveStablecoinGateRequest, xCorrelationId)

Approve a stablecoin gate

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinsApi()
val stablecoinId : kotlin.String = stablecoinId_example // kotlin.String | 
val approveStablecoinGateRequest : ApproveStablecoinGateRequest =  // ApproveStablecoinGateRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Stablecoin = apiInstance.approveStablecoinGate(stablecoinId, approveStablecoinGateRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinsApi#approveStablecoinGate")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinsApi#approveStablecoinGate")
    e.printStackTrace()
}
```

### Parameters
| **stablecoinId** | **kotlin.String**|  | |
| **approveStablecoinGateRequest** | [**ApproveStablecoinGateRequest**](ApproveStablecoinGateRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Stablecoin**](Stablecoin.md)

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

<a id="createStablecoin"></a>
# **createStablecoin**
> Stablecoin createStablecoin(idempotencyKey, createStablecoinRequest, xCorrelationId)

Create a stablecoin control-plane record

Feature-flag gated; public issuance remains disabled until readiness gates pass.

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinsApi()
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val createStablecoinRequest : CreateStablecoinRequest =  // CreateStablecoinRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Stablecoin = apiInstance.createStablecoin(idempotencyKey, createStablecoinRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinsApi#createStablecoin")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinsApi#createStablecoin")
    e.printStackTrace()
}
```

### Parameters
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **createStablecoinRequest** | [**CreateStablecoinRequest**](CreateStablecoinRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Stablecoin**](Stablecoin.md)

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

<a id="getStablecoin"></a>
# **getStablecoin**
> Stablecoin getStablecoin(stablecoinId, xCorrelationId)

Get a stablecoin

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinsApi()
val stablecoinId : kotlin.String = stablecoinId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Stablecoin = apiInstance.getStablecoin(stablecoinId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinsApi#getStablecoin")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinsApi#getStablecoin")
    e.printStackTrace()
}
```

### Parameters
| **stablecoinId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Stablecoin**](Stablecoin.md)

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

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="listStablecoins"></a>
# **listStablecoins**
> kotlin.collections.List&lt;Stablecoin&gt; listStablecoins(xCorrelationId)

List stablecoins

Stablecoin features are disabled by default until readiness gates pass.

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinsApi()
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : kotlin.collections.List<Stablecoin> = apiInstance.listStablecoins(xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinsApi#listStablecoins")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinsApi#listStablecoins")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**kotlin.collections.List&lt;Stablecoin&gt;**](Stablecoin.md)

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

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="submitStablecoinForReview"></a>
# **submitStablecoinForReview**
> Stablecoin submitStablecoinForReview(stablecoinId, xCorrelationId)

Submit a stablecoin for review

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinsApi()
val stablecoinId : kotlin.String = stablecoinId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Stablecoin = apiInstance.submitStablecoinForReview(stablecoinId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinsApi#submitStablecoinForReview")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinsApi#submitStablecoinForReview")
    e.printStackTrace()
}
```

### Parameters
| **stablecoinId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Stablecoin**](Stablecoin.md)

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

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="suspendStablecoin"></a>
# **suspendStablecoin**
> Stablecoin suspendStablecoin(stablecoinId, suspendStablecoinRequest, xCorrelationId)

Suspend stablecoin minting, redemption, or both

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = StablecoinsApi()
val stablecoinId : kotlin.String = stablecoinId_example // kotlin.String | 
val suspendStablecoinRequest : SuspendStablecoinRequest =  // SuspendStablecoinRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Stablecoin = apiInstance.suspendStablecoin(stablecoinId, suspendStablecoinRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling StablecoinsApi#suspendStablecoin")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling StablecoinsApi#suspendStablecoin")
    e.printStackTrace()
}
```

### Parameters
| **stablecoinId** | **kotlin.String**|  | |
| **suspendStablecoinRequest** | [**SuspendStablecoinRequest**](SuspendStablecoinRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Stablecoin**](Stablecoin.md)

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

