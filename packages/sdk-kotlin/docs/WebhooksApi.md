# WebhooksApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createWebhook**](WebhooksApi.md#createWebhook) | **POST** /api/v1/webhooks | Register a webhook endpoint |
| [**disableWebhook**](WebhooksApi.md#disableWebhook) | **DELETE** /api/v1/webhooks/{id} | Disable a webhook endpoint |
| [**listWebhooks**](WebhooksApi.md#listWebhooks) | **GET** /api/v1/webhooks | List webhook endpoints |
| [**rotateWebhookSecret**](WebhooksApi.md#rotateWebhookSecret) | **POST** /api/v1/webhooks/{id}/rotate-secret | Rotate webhook signing secret |


<a id="createWebhook"></a>
# **createWebhook**
> WebhookEndpointWithSecret createWebhook(webhookCreateRequest, xCorrelationId)

Register a webhook endpoint

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = WebhooksApi()
val webhookCreateRequest : WebhookCreateRequest =  // WebhookCreateRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : WebhookEndpointWithSecret = apiInstance.createWebhook(webhookCreateRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling WebhooksApi#createWebhook")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling WebhooksApi#createWebhook")
    e.printStackTrace()
}
```

### Parameters
| **webhookCreateRequest** | [**WebhookCreateRequest**](WebhookCreateRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**WebhookEndpointWithSecret**](WebhookEndpointWithSecret.md)

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

<a id="disableWebhook"></a>
# **disableWebhook**
> disableWebhook(id, xCorrelationId)

Disable a webhook endpoint

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = WebhooksApi()
val id : kotlin.String = id_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    apiInstance.disableWebhook(id, xCorrelationId)
} catch (e: ClientException) {
    println("4xx response calling WebhooksApi#disableWebhook")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling WebhooksApi#disableWebhook")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

null (empty response body)

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
 - **Accept**: Not defined

<a id="listWebhooks"></a>
# **listWebhooks**
> kotlin.collections.List&lt;WebhookEndpoint&gt; listWebhooks(xCorrelationId)

List webhook endpoints

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = WebhooksApi()
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : kotlin.collections.List<WebhookEndpoint> = apiInstance.listWebhooks(xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling WebhooksApi#listWebhooks")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling WebhooksApi#listWebhooks")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**kotlin.collections.List&lt;WebhookEndpoint&gt;**](WebhookEndpoint.md)

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

<a id="rotateWebhookSecret"></a>
# **rotateWebhookSecret**
> WebhookEndpointWithSecret rotateWebhookSecret(id, xCorrelationId)

Rotate webhook signing secret

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = WebhooksApi()
val id : kotlin.String = id_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : WebhookEndpointWithSecret = apiInstance.rotateWebhookSecret(id, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling WebhooksApi#rotateWebhookSecret")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling WebhooksApi#rotateWebhookSecret")
    e.printStackTrace()
}
```

### Parameters
| **id** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**WebhookEndpointWithSecret**](WebhookEndpointWithSecret.md)

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

