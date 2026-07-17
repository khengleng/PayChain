# TransactionsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**approveCompensation**](TransactionsApi.md#approveCompensation) | **POST** /api/v1/transactions/compensations/{compensationId}/approve | Approve a pending compensation |
| [**createCompensation**](TransactionsApi.md#createCompensation) | **POST** /api/v1/transactions/{transactionId}/compensate | Create a compensating transaction |
| [**getTransaction**](TransactionsApi.md#getTransaction) | **GET** /api/v1/transactions/{transactionId} | Get a transaction |
| [**listTransactions**](TransactionsApi.md#listTransactions) | **GET** /api/v1/transactions | List transactions |


<a id="approveCompensation"></a>
# **approveCompensation**
> Compensation approveCompensation(compensationId, xCorrelationId)

Approve a pending compensation

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = TransactionsApi()
val compensationId : kotlin.String = compensationId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Compensation = apiInstance.approveCompensation(compensationId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TransactionsApi#approveCompensation")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TransactionsApi#approveCompensation")
    e.printStackTrace()
}
```

### Parameters
| **compensationId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Compensation**](Compensation.md)

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

<a id="createCompensation"></a>
# **createCompensation**
> Compensation createCompensation(transactionId, idempotencyKey, compensationRequest, xCorrelationId)

Create a compensating transaction

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = TransactionsApi()
val transactionId : kotlin.String = transactionId_example // kotlin.String | 
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val compensationRequest : CompensationRequest =  // CompensationRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Compensation = apiInstance.createCompensation(transactionId, idempotencyKey, compensationRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TransactionsApi#createCompensation")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TransactionsApi#createCompensation")
    e.printStackTrace()
}
```

### Parameters
| **transactionId** | **kotlin.String**|  | |
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **compensationRequest** | [**CompensationRequest**](CompensationRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Compensation**](Compensation.md)

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

<a id="getTransaction"></a>
# **getTransaction**
> Transaction getTransaction(transactionId, xCorrelationId)

Get a transaction

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = TransactionsApi()
val transactionId : kotlin.String = transactionId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Transaction = apiInstance.getTransaction(transactionId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TransactionsApi#getTransaction")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TransactionsApi#getTransaction")
    e.printStackTrace()
}
```

### Parameters
| **transactionId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Transaction**](Transaction.md)

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

<a id="listTransactions"></a>
# **listTransactions**
> kotlin.collections.List&lt;Transaction&gt; listTransactions(limit, xCorrelationId)

List transactions

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = TransactionsApi()
val limit : kotlin.Int = 56 // kotlin.Int | Maximum number of rows to return. The API caps this at 200.
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : kotlin.collections.List<Transaction> = apiInstance.listTransactions(limit, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling TransactionsApi#listTransactions")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling TransactionsApi#listTransactions")
    e.printStackTrace()
}
```

### Parameters
| **limit** | **kotlin.Int**| Maximum number of rows to return. The API caps this at 200. | [optional] [default to 50] |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**kotlin.collections.List&lt;Transaction&gt;**](Transaction.md)

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

