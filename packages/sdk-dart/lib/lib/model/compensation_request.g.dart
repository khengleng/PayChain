// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'compensation_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CompensationRequestReasonEnum
    _$compensationRequestReasonEnum_MERCHANT_ERROR =
    const CompensationRequestReasonEnum._('MERCHANT_ERROR');
const CompensationRequestReasonEnum _$compensationRequestReasonEnum_REFUND =
    const CompensationRequestReasonEnum._('REFUND');
const CompensationRequestReasonEnum _$compensationRequestReasonEnum_FRAUD =
    const CompensationRequestReasonEnum._('FRAUD');
const CompensationRequestReasonEnum
    _$compensationRequestReasonEnum_DUPLICATE_REWARD =
    const CompensationRequestReasonEnum._('DUPLICATE_REWARD');
const CompensationRequestReasonEnum
    _$compensationRequestReasonEnum_CAMPAIGN_CANCELLATION =
    const CompensationRequestReasonEnum._('CAMPAIGN_CANCELLATION');
const CompensationRequestReasonEnum _$compensationRequestReasonEnum_DISPUTE =
    const CompensationRequestReasonEnum._('DISPUTE');
const CompensationRequestReasonEnum
    _$compensationRequestReasonEnum_MANUAL_CORRECTION =
    const CompensationRequestReasonEnum._('MANUAL_CORRECTION');
const CompensationRequestReasonEnum
    _$compensationRequestReasonEnum_EXPIRY_CORRECTION =
    const CompensationRequestReasonEnum._('EXPIRY_CORRECTION');
const CompensationRequestReasonEnum
    _$compensationRequestReasonEnum_unknownDefaultOpenApi =
    const CompensationRequestReasonEnum._('unknownDefaultOpenApi');

CompensationRequestReasonEnum _$compensationRequestReasonEnumValueOf(
    String name) {
  switch (name) {
    case 'MERCHANT_ERROR':
      return _$compensationRequestReasonEnum_MERCHANT_ERROR;
    case 'REFUND':
      return _$compensationRequestReasonEnum_REFUND;
    case 'FRAUD':
      return _$compensationRequestReasonEnum_FRAUD;
    case 'DUPLICATE_REWARD':
      return _$compensationRequestReasonEnum_DUPLICATE_REWARD;
    case 'CAMPAIGN_CANCELLATION':
      return _$compensationRequestReasonEnum_CAMPAIGN_CANCELLATION;
    case 'DISPUTE':
      return _$compensationRequestReasonEnum_DISPUTE;
    case 'MANUAL_CORRECTION':
      return _$compensationRequestReasonEnum_MANUAL_CORRECTION;
    case 'EXPIRY_CORRECTION':
      return _$compensationRequestReasonEnum_EXPIRY_CORRECTION;
    case 'unknownDefaultOpenApi':
      return _$compensationRequestReasonEnum_unknownDefaultOpenApi;
    default:
      return _$compensationRequestReasonEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<CompensationRequestReasonEnum>
    _$compensationRequestReasonEnumValues = BuiltSet<
        CompensationRequestReasonEnum>(const <CompensationRequestReasonEnum>[
  _$compensationRequestReasonEnum_MERCHANT_ERROR,
  _$compensationRequestReasonEnum_REFUND,
  _$compensationRequestReasonEnum_FRAUD,
  _$compensationRequestReasonEnum_DUPLICATE_REWARD,
  _$compensationRequestReasonEnum_CAMPAIGN_CANCELLATION,
  _$compensationRequestReasonEnum_DISPUTE,
  _$compensationRequestReasonEnum_MANUAL_CORRECTION,
  _$compensationRequestReasonEnum_EXPIRY_CORRECTION,
  _$compensationRequestReasonEnum_unknownDefaultOpenApi,
]);

Serializer<CompensationRequestReasonEnum>
    _$compensationRequestReasonEnumSerializer =
    _$CompensationRequestReasonEnumSerializer();

class _$CompensationRequestReasonEnumSerializer
    implements PrimitiveSerializer<CompensationRequestReasonEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'MERCHANT_ERROR': 'MERCHANT_ERROR',
    'REFUND': 'REFUND',
    'FRAUD': 'FRAUD',
    'DUPLICATE_REWARD': 'DUPLICATE_REWARD',
    'CAMPAIGN_CANCELLATION': 'CAMPAIGN_CANCELLATION',
    'DISPUTE': 'DISPUTE',
    'MANUAL_CORRECTION': 'MANUAL_CORRECTION',
    'EXPIRY_CORRECTION': 'EXPIRY_CORRECTION',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'MERCHANT_ERROR': 'MERCHANT_ERROR',
    'REFUND': 'REFUND',
    'FRAUD': 'FRAUD',
    'DUPLICATE_REWARD': 'DUPLICATE_REWARD',
    'CAMPAIGN_CANCELLATION': 'CAMPAIGN_CANCELLATION',
    'DISPUTE': 'DISPUTE',
    'MANUAL_CORRECTION': 'MANUAL_CORRECTION',
    'EXPIRY_CORRECTION': 'EXPIRY_CORRECTION',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[CompensationRequestReasonEnum];
  @override
  final String wireName = 'CompensationRequestReasonEnum';

  @override
  Object serialize(
          Serializers serializers, CompensationRequestReasonEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CompensationRequestReasonEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CompensationRequestReasonEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CompensationRequest extends CompensationRequest {
  @override
  final String amount;
  @override
  final CompensationRequestReasonEnum reason;

  factory _$CompensationRequest(
          [void Function(CompensationRequestBuilder)? updates]) =>
      (CompensationRequestBuilder()..update(updates))._build();

  _$CompensationRequest._({required this.amount, required this.reason})
      : super._();
  @override
  CompensationRequest rebuild(
          void Function(CompensationRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CompensationRequestBuilder toBuilder() =>
      CompensationRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CompensationRequest &&
        amount == other.amount &&
        reason == other.reason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CompensationRequest')
          ..add('amount', amount)
          ..add('reason', reason))
        .toString();
  }
}

class CompensationRequestBuilder
    implements Builder<CompensationRequest, CompensationRequestBuilder> {
  _$CompensationRequest? _$v;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  CompensationRequestReasonEnum? _reason;
  CompensationRequestReasonEnum? get reason => _$this._reason;
  set reason(CompensationRequestReasonEnum? reason) => _$this._reason = reason;

  CompensationRequestBuilder() {
    CompensationRequest._defaults(this);
  }

  CompensationRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _amount = $v.amount;
      _reason = $v.reason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CompensationRequest other) {
    _$v = other as _$CompensationRequest;
  }

  @override
  void update(void Function(CompensationRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CompensationRequest build() => _build();

  _$CompensationRequest _build() {
    final _$result = _$v ??
        _$CompensationRequest._(
          amount: BuiltValueNullFieldError.checkNotNull(
              amount, r'CompensationRequest', 'amount'),
          reason: BuiltValueNullFieldError.checkNotNull(
              reason, r'CompensationRequest', 'reason'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
