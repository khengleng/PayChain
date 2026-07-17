# WalletsApi

All URIs are relative to *https://api.paychain.cambobia.com*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createWallet**](WalletsApi.md#createWallet) | **POST** /api/v1/wallets | Create a managed custodial wallet |
| [**getWallet**](WalletsApi.md#getWallet) | **GET** /api/v1/wallets/{walletId} | Get a wallet |
| [**listWalletBalances**](WalletsApi.md#listWalletBalances) | **GET** /api/v1/wallets/{walletId}/balances | List wallet balances |


<a id="createWallet"></a>
# **createWallet**
> Wallet createWallet(idempotencyKey, createWalletRequest, xCorrelationId)

Create a managed custodial wallet

Creates the Stellar account and records the wallet under the caller tenant.

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = WalletsApi()
val idempotencyKey : kotlin.String = idempotencyKey_example // kotlin.String | Required on replay-safe writes so retries cannot double-apply.
val createWalletRequest : CreateWalletRequest =  // CreateWalletRequest | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Wallet = apiInstance.createWallet(idempotencyKey, createWalletRequest, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling WalletsApi#createWallet")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling WalletsApi#createWallet")
    e.printStackTrace()
}
```

### Parameters
| **idempotencyKey** | **kotlin.String**| Required on replay-safe writes so retries cannot double-apply. | |
| **createWalletRequest** | [**CreateWalletRequest**](CreateWalletRequest.md)|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Wallet**](Wallet.md)

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

<a id="getWallet"></a>
# **getWallet**
> Wallet getWallet(walletId, xCorrelationId)

Get a wallet

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = WalletsApi()
val walletId : kotlin.String = walletId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : Wallet = apiInstance.getWallet(walletId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling WalletsApi#getWallet")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling WalletsApi#getWallet")
    e.printStackTrace()
}
```

### Parameters
| **walletId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**Wallet**](Wallet.md)

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

<a id="listWalletBalances"></a>
# **listWalletBalances**
> kotlin.collections.List&lt;Balance&gt; listWalletBalances(walletId, xCorrelationId)

List wallet balances

Refreshes the rebuildable balance read model from chain before returning balances.

### Example
```kotlin
// Import classes:
//import com.paychain.sdk.infrastructure.*
//import com.paychain.sdk.models.*

val apiInstance = WalletsApi()
val walletId : kotlin.String = walletId_example // kotlin.String | 
val xCorrelationId : java.util.UUID = 38400000-8cf0-11bd-b23e-10b96e4ef00d // java.util.UUID | Optional caller-supplied correlation id echoed through logs and audit records.
try {
    val result : kotlin.collections.List<Balance> = apiInstance.listWalletBalances(walletId, xCorrelationId)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling WalletsApi#listWalletBalances")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling WalletsApi#listWalletBalances")
    e.printStackTrace()
}
```

### Parameters
| **walletId** | **kotlin.String**|  | |
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **xCorrelationId** | **java.util.UUID**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] |

### Return type

[**kotlin.collections.List&lt;Balance&gt;**](Balance.md)

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

