//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_import

import 'package:one_of_serializer/any_of_serializer.dart';
import 'package:one_of_serializer/one_of_serializer.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:built_value/standard_json_plugin.dart';
import 'package:built_value/iso_8601_date_time_serializer.dart';
import 'package:paychain_sdk/lib/date_serializer.dart';
import 'package:paychain_sdk/lib/model/date.dart';

import 'package:paychain_sdk/lib/model/approve_stablecoin_gate_request.dart';
import 'package:paychain_sdk/lib/model/asset.dart';
import 'package:paychain_sdk/lib/model/balance.dart';
import 'package:paychain_sdk/lib/model/burn_request.dart';
import 'package:paychain_sdk/lib/model/compensation.dart';
import 'package:paychain_sdk/lib/model/compensation_request.dart';
import 'package:paychain_sdk/lib/model/conversion_quote_request.dart';
import 'package:paychain_sdk/lib/model/create_asset_request.dart';
import 'package:paychain_sdk/lib/model/create_stablecoin_request.dart';
import 'package:paychain_sdk/lib/model/create_wallet_request.dart';
import 'package:paychain_sdk/lib/model/earn_request.dart';
import 'package:paychain_sdk/lib/model/error_response.dart';
import 'package:paychain_sdk/lib/model/error_response_message.dart';
import 'package:paychain_sdk/lib/model/health.dart';
import 'package:paychain_sdk/lib/model/health_ready.dart';
import 'package:paychain_sdk/lib/model/issue_request.dart';
import 'package:paychain_sdk/lib/model/mint_request.dart';
import 'package:paychain_sdk/lib/model/redeem_request.dart';
import 'package:paychain_sdk/lib/model/redemption_request.dart';
import 'package:paychain_sdk/lib/model/stablecoin.dart';
import 'package:paychain_sdk/lib/model/suspend_stablecoin_request.dart';
import 'package:paychain_sdk/lib/model/token_request.dart';
import 'package:paychain_sdk/lib/model/token_response.dart';
import 'package:paychain_sdk/lib/model/transaction.dart';
import 'package:paychain_sdk/lib/model/transaction_record.dart';
import 'package:paychain_sdk/lib/model/transfer_request.dart';
import 'package:paychain_sdk/lib/model/wallet.dart';
import 'package:paychain_sdk/lib/model/webhook_create_request.dart';
import 'package:paychain_sdk/lib/model/webhook_endpoint.dart';
import 'package:paychain_sdk/lib/model/webhook_endpoint_with_secret.dart';

part 'serializers.g.dart';

@SerializersFor([
  ApproveStablecoinGateRequest,
  Asset,
  Balance,
  BurnRequest,
  Compensation,
  CompensationRequest,
  ConversionQuoteRequest,
  CreateAssetRequest,
  CreateStablecoinRequest,
  CreateWalletRequest,
  EarnRequest,
  ErrorResponse,
  ErrorResponseMessage,
  Health,
  HealthReady,
  IssueRequest,
  MintRequest,
  RedeemRequest,
  RedemptionRequest,
  Stablecoin,
  SuspendStablecoinRequest,
  TokenRequest,
  TokenResponse,
  Transaction,
  TransactionRecord,
  TransferRequest,
  Wallet,
  WebhookCreateRequest,
  WebhookEndpoint,$WebhookEndpoint,
  WebhookEndpointWithSecret,
])
Serializers serializers = (_$serializers.toBuilder()
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(Transaction)]),
        () => ListBuilder<Transaction>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(Balance)]),
        () => ListBuilder<Balance>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(Stablecoin)]),
        () => ListBuilder<Stablecoin>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(WebhookEndpoint)]),
        () => ListBuilder<WebhookEndpoint>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(Asset)]),
        () => ListBuilder<Asset>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltMap, [FullType(String), FullType(JsonObject)]),
        () => MapBuilder<String, JsonObject>(),
      )
      ..add(WebhookEndpoint.serializer)
      ..add(const OneOfSerializer())
      ..add(const AnyOfSerializer())
      ..add(const DateSerializer())
      ..add(Iso8601DateTimeSerializer())
    ).build();

Serializers standardSerializers =
    (serializers.toBuilder()..addPlugin(StandardJsonPlugin())).build();
