
# CreateStablecoinRequest

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **assetCode** | **kotlin.String** |  |  |
| **assetName** | **kotlin.String** |  |  |
| **classification** | [**inline**](#Classification) |  |  |
| **referenceCurrency** | [**inline**](#ReferenceCurrency) |  |  |
| **issuerLegalEntity** | **kotlin.String** |  |  [optional] |
| **jurisdiction** | **kotlin.String** |  |  [optional] |
| **reserveRatioTarget** | **kotlin.String** |  |  [optional] |


<a id="Classification"></a>
## Enum: classification
| Name | Value |
| ---- | ----- |
| classification | FIAT_BACKED_STABLECOIN, TOKENIZED_DEPOSIT, STABLE_VALUE_CREDIT |


<a id="ReferenceCurrency"></a>
## Enum: referenceCurrency
| Name | Value |
| ---- | ----- |
| referenceCurrency | USD, KHR |



