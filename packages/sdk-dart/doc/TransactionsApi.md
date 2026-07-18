# paychain_sdk.api.TransactionsApi

## Load the API package
```dart
import 'package:paychain_sdk/api.dart';
```

All URIs are relative to *https://api.paychain.cambobia.com*

Method | HTTP request | Description
------------- | ------------- | -------------
[**approveCompensation**](TransactionsApi.md#approvecompensation) | **POST** /api/v1/transactions/compensations/{compensationId}/approve | Approve a pending compensation
[**createCompensation**](TransactionsApi.md#createcompensation) | **POST** /api/v1/transactions/{transactionId}/compensate | Create a compensating transaction
[**getTransaction**](TransactionsApi.md#gettransaction) | **GET** /api/v1/transactions/{transactionId} | Get a transaction
[**listTransactions**](TransactionsApi.md#listtransactions) | **GET** /api/v1/transactions | List transactions


# **approveCompensation**
> Compensation approveCompensation(compensationId, xCorrelationId)

Approve a pending compensation

### Example
```dart
import 'package:paychain_sdk/api.dart';
// Configure OAuth2 client credentials before calling authenticated endpoints.
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getTransactionsApi();
final String compensationId = compensationId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.approveCompensation(compensationId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling TransactionsApi->approveCompensation: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **compensationId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Compensation**](Compensation.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createCompensation**
> Compensation createCompensation(transactionId, idempotencyKey, compensationRequest, xCorrelationId)

Create a compensating transaction

### Example
```dart
import 'package:paychain_sdk/api.dart';
// Configure OAuth2 client credentials before calling authenticated endpoints.
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getTransactionsApi();
final String transactionId = transactionId_example; // String | 
final String idempotencyKey = idempotencyKey_example; // String | Required on replay-safe writes so retries cannot double-apply.
final CompensationRequest compensationRequest = ; // CompensationRequest | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.createCompensation(transactionId, idempotencyKey, compensationRequest, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling TransactionsApi->createCompensation: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **transactionId** | **String**|  | 
 **idempotencyKey** | **String**| Required on replay-safe writes so retries cannot double-apply. | 
 **compensationRequest** | [**CompensationRequest**](CompensationRequest.md)|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Compensation**](Compensation.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getTransaction**
> Transaction getTransaction(transactionId, xCorrelationId)

Get a transaction

### Example
```dart
import 'package:paychain_sdk/api.dart';
// Configure OAuth2 client credentials before calling authenticated endpoints.
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getTransactionsApi();
final String transactionId = transactionId_example; // String | 
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.getTransaction(transactionId, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling TransactionsApi->getTransaction: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **transactionId** | **String**|  | 
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**Transaction**](Transaction.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listTransactions**
> BuiltList<Transaction> listTransactions(limit, xCorrelationId)

List transactions

### Example
```dart
import 'package:paychain_sdk/api.dart';
// Configure OAuth2 client credentials before calling authenticated endpoints.
//defaultApiClient.getAuthentication<OAuth>('oauth2ClientCredentials').accessToken = 'YOUR_ACCESS_TOKEN';

final api = PaychainSdk().getTransactionsApi();
final int limit = 56; // int | Maximum number of rows to return. The API caps this at 200.
final String xCorrelationId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Optional caller-supplied correlation id echoed through logs and audit records.

try {
    final response = api.listTransactions(limit, xCorrelationId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling TransactionsApi->listTransactions: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Maximum number of rows to return. The API caps this at 200. | [optional] [default to 50]
 **xCorrelationId** | **String**| Optional caller-supplied correlation id echoed through logs and audit records. | [optional] 

### Return type

[**BuiltList&lt;Transaction&gt;**](Transaction.md)

### Authorization

[oauth2ClientCredentials](../README.md#oauth2ClientCredentials)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

