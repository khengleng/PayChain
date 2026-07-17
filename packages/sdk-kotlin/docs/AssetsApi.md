# AssetsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**activateAsset**](AssetsApi.md#activateAsset) | **POST** /api/v1/assets/{assetId}/activate | Activate an asset |
| [**burnAsset**](AssetsApi.md#burnAsset) | **POST** /api/v1/assets/{assetId}/burn | Burn loyalty value |
| [**createAsset**](AssetsApi.md#createAsset) | **POST** /api/v1/assets | Create an asset |
| [**earnAsset**](AssetsApi.md#earnAsset) | **POST** /api/v1/assets/{assetId}/earn | Evaluate earn rules and award points |
| [**getAsset**](AssetsApi.md#getAsset) | **GET** /api/v1/assets/{assetId} | Get an asset |
| [**issueAsset**](AssetsApi.md#issueAsset) | **POST** /api/v1/assets/{assetId}/issue | Issue loyalty value |
| [**listAssets**](AssetsApi.md#listAssets) | **GET** /api/v1/assets | List assets |
| [**redeemAsset**](AssetsApi.md#redeemAsset) | **POST** /api/v1/assets/{assetId}/redeem | Redeem loyalty value |
| [**transferAsset**](AssetsApi.md#transferAsset) | **POST** /api/v1/assets/{assetId}/transfer | Transfer loyalty value |


<a id="activateAsset"></a>
# **activateAsset**
> Asset activateAsset(assetId, xCorrelationId)

Activate an asset

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val assetId : kotlin.String = assetId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Asset = apiInstance.activateAsset(assetId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#activateAsset")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#activateAsset")
    e.printStackTrace()
}
```

### Parameters
| **assetId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Asset**](Asset.md)

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

<a id="burnAsset"></a>
# **burnAsset**
> TransactionRecord burnAsset(assetId, idempotencyKey, burnRequest, xCorrelationId)

Burn loyalty value

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val assetId : kotlin.String = assetId_example // kotlin.String | 
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val burnRequest : BurnRequest =  // BurnRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : TransactionRecord = apiInstance.burnAsset(assetId, idempotencyKey, burnRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#burnAsset")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#burnAsset")
    e.printStackTrace()
}
```

### Parameters
| **assetId** | **kotlin.String**|  | |
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **burnRequest** | [**BurnRequest**](BurnRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**TransactionRecord**](TransactionRecord.md)

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

<a id="createAsset"></a>
# **createAsset**
> Asset createAsset(idempotencyKey, createAssetRequest, xCorrelationId)

Create an asset

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val createAssetRequest : CreateAssetRequest =  // CreateAssetRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Asset = apiInstance.createAsset(idempotencyKey, createAssetRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#createAsset")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#createAsset")
    e.printStackTrace()
}
```

### Parameters
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **createAssetRequest** | [**CreateAssetRequest**](CreateAssetRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Asset**](Asset.md)

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

<a id="earnAsset"></a>
# **earnAsset**
> TransactionRecord earnAsset(assetId, idempotencyKey, earnRequest, xCorrelationId)

Evaluate earn rules and award points

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val assetId : kotlin.String = assetId_example // kotlin.String | 
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val earnRequest : EarnRequest =  // EarnRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : TransactionRecord = apiInstance.earnAsset(assetId, idempotencyKey, earnRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#earnAsset")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#earnAsset")
    e.printStackTrace()
}
```

### Parameters
| **assetId** | **kotlin.String**|  | |
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **earnRequest** | [**EarnRequest**](EarnRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**TransactionRecord**](TransactionRecord.md)

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

<a id="getAsset"></a>
# **getAsset**
> Asset getAsset(assetId, xCorrelationId)

Get an asset

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val assetId : kotlin.String = assetId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Asset = apiInstance.getAsset(assetId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#getAsset")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#getAsset")
    e.printStackTrace()
}
```

### Parameters
| **assetId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Asset**](Asset.md)

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

<a id="issueAsset"></a>
# **issueAsset**
> TransactionRecord issueAsset(assetId, idempotencyKey, issueRequest, xCorrelationId)

Issue loyalty value

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val assetId : kotlin.String = assetId_example // kotlin.String | 
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val issueRequest : IssueRequest =  // IssueRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : TransactionRecord = apiInstance.issueAsset(assetId, idempotencyKey, issueRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#issueAsset")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#issueAsset")
    e.printStackTrace()
}
```

### Parameters
| **assetId** | **kotlin.String**|  | |
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **issueRequest** | [**IssueRequest**](IssueRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**TransactionRecord**](TransactionRecord.md)

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

<a id="listAssets"></a>
# **listAssets**
> kotlin.collections.List&lt;Asset&gt; listAssets(xCorrelationId)

List assets

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : kotlin.collections.List<Asset> = apiInstance.listAssets(xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#listAssets")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#listAssets")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**kotlin.collections.List&lt;Asset&gt;**](Asset.md)

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

<a id="redeemAsset"></a>
# **redeemAsset**
> TransactionRecord redeemAsset(assetId, idempotencyKey, redeemRequest, xCorrelationId)

Redeem loyalty value

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val assetId : kotlin.String = assetId_example // kotlin.String | 
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val redeemRequest : RedeemRequest =  // RedeemRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : TransactionRecord = apiInstance.redeemAsset(assetId, idempotencyKey, redeemRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#redeemAsset")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#redeemAsset")
    e.printStackTrace()
}
```

### Parameters
| **assetId** | **kotlin.String**|  | |
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **redeemRequest** | [**RedeemRequest**](RedeemRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**TransactionRecord**](TransactionRecord.md)

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

<a id="transferAsset"></a>
# **transferAsset**
> TransactionRecord transferAsset(assetId, idempotencyKey, transferRequest, xCorrelationId)

Transfer loyalty value

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = AssetsApi()
val assetId : kotlin.String = assetId_example // kotlin.String | 
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val transferRequest : TransferRequest =  // TransferRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : TransactionRecord = apiInstance.transferAsset(assetId, idempotencyKey, transferRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling AssetsApi#transferAsset")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling AssetsApi#transferAsset")
    e.printStackTrace()
}
```

### Parameters
| **assetId** | **kotlin.String**|  | |
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **transferRequest** | [**TransferRequest**](TransferRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**TransactionRecord**](TransactionRecord.md)

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

