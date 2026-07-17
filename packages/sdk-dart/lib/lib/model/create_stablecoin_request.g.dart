// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_stablecoin_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateStablecoinRequestClassificationEnum
    _$createStablecoinRequestClassificationEnum_FIAT_BACKED_STABLECOIN =
    const CreateStablecoinRequestClassificationEnum._('FIAT_BACKED_STABLECOIN');
const CreateStablecoinRequestClassificationEnum
    _$createStablecoinRequestClassificationEnum_TOKENIZED_DEPOSIT =
    const CreateStablecoinRequestClassificationEnum._('TOKENIZED_DEPOSIT');
const CreateStablecoinRequestClassificationEnum
    _$createStablecoinRequestClassificationEnum_STABLE_VALUE_CREDIT =
    const CreateStablecoinRequestClassificationEnum._('STABLE_VALUE_CREDIT');
const CreateStablecoinRequestClassificationEnum
    _$createStablecoinRequestClassificationEnum_unknownDefaultOpenApi =
    const CreateStablecoinRequestClassificationEnum._('unknownDefaultOpenApi');

CreateStablecoinRequestClassificationEnum
    _$createStablecoinRequestClassificationEnumValueOf(String name) {
  switch (name) {
    case 'FIAT_BACKED_STABLECOIN':
      return _$createStablecoinRequestClassificationEnum_FIAT_BACKED_STABLECOIN;
    case 'TOKENIZED_DEPOSIT':
      return _$createStablecoinRequestClassificationEnum_TOKENIZED_DEPOSIT;
    case 'STABLE_VALUE_CREDIT':
      return _$createStablecoinRequestClassificationEnum_STABLE_VALUE_CREDIT;
    case 'unknownDefaultOpenApi':
      return _$createStablecoinRequestClassificationEnum_unknownDefaultOpenApi;
    default:
      return _$createStablecoinRequestClassificationEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<CreateStablecoinRequestClassificationEnum>
    _$createStablecoinRequestClassificationEnumValues = BuiltSet<
        CreateStablecoinRequestClassificationEnum>(const <CreateStablecoinRequestClassificationEnum>[
  _$createStablecoinRequestClassificationEnum_FIAT_BACKED_STABLECOIN,
  _$createStablecoinRequestClassificationEnum_TOKENIZED_DEPOSIT,
  _$createStablecoinRequestClassificationEnum_STABLE_VALUE_CREDIT,
  _$createStablecoinRequestClassificationEnum_unknownDefaultOpenApi,
]);

const CreateStablecoinRequestReferenceCurrencyEnum
    _$createStablecoinRequestReferenceCurrencyEnum_USD =
    const CreateStablecoinRequestReferenceCurrencyEnum._('USD');
const CreateStablecoinRequestReferenceCurrencyEnum
    _$createStablecoinRequestReferenceCurrencyEnum_KHR =
    const CreateStablecoinRequestReferenceCurrencyEnum._('KHR');
const CreateStablecoinRequestReferenceCurrencyEnum
    _$createStablecoinRequestReferenceCurrencyEnum_unknownDefaultOpenApi =
    const CreateStablecoinRequestReferenceCurrencyEnum._(
        'unknownDefaultOpenApi');

CreateStablecoinRequestReferenceCurrencyEnum
    _$createStablecoinRequestReferenceCurrencyEnumValueOf(String name) {
  switch (name) {
    case 'USD':
      return _$createStablecoinRequestReferenceCurrencyEnum_USD;
    case 'KHR':
      return _$createStablecoinRequestReferenceCurrencyEnum_KHR;
    case 'unknownDefaultOpenApi':
      return _$createStablecoinRequestReferenceCurrencyEnum_unknownDefaultOpenApi;
    default:
      return _$createStablecoinRequestReferenceCurrencyEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<CreateStablecoinRequestReferenceCurrencyEnum>
    _$createStablecoinRequestReferenceCurrencyEnumValues = BuiltSet<
        CreateStablecoinRequestReferenceCurrencyEnum>(const <CreateStablecoinRequestReferenceCurrencyEnum>[
  _$createStablecoinRequestReferenceCurrencyEnum_USD,
  _$createStablecoinRequestReferenceCurrencyEnum_KHR,
  _$createStablecoinRequestReferenceCurrencyEnum_unknownDefaultOpenApi,
]);

Serializer<CreateStablecoinRequestClassificationEnum>
    _$createStablecoinRequestClassificationEnumSerializer =
    _$CreateStablecoinRequestClassificationEnumSerializer();
Serializer<CreateStablecoinRequestReferenceCurrencyEnum>
    _$createStablecoinRequestReferenceCurrencyEnumSerializer =
    _$CreateStablecoinRequestReferenceCurrencyEnumSerializer();

class _$CreateStablecoinRequestClassificationEnumSerializer
    implements PrimitiveSerializer<CreateStablecoinRequestClassificationEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'FIAT_BACKED_STABLECOIN': 'FIAT_BACKED_STABLECOIN',
    'TOKENIZED_DEPOSIT': 'TOKENIZED_DEPOSIT',
    'STABLE_VALUE_CREDIT': 'STABLE_VALUE_CREDIT',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'FIAT_BACKED_STABLECOIN': 'FIAT_BACKED_STABLECOIN',
    'TOKENIZED_DEPOSIT': 'TOKENIZED_DEPOSIT',
    'STABLE_VALUE_CREDIT': 'STABLE_VALUE_CREDIT',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[
    CreateStablecoinRequestClassificationEnum
  ];
  @override
  final String wireName = 'CreateStablecoinRequestClassificationEnum';

  @override
  Object serialize(Serializers serializers,
          CreateStablecoinRequestClassificationEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateStablecoinRequestClassificationEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateStablecoinRequestClassificationEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateStablecoinRequestReferenceCurrencyEnumSerializer
    implements
        PrimitiveSerializer<CreateStablecoinRequestReferenceCurrencyEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'USD': 'USD',
    'KHR': 'KHR',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'USD': 'USD',
    'KHR': 'KHR',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[
    CreateStablecoinRequestReferenceCurrencyEnum
  ];
  @override
  final String wireName = 'CreateStablecoinRequestReferenceCurrencyEnum';

  @override
  Object serialize(Serializers serializers,
          CreateStablecoinRequestReferenceCurrencyEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateStablecoinRequestReferenceCurrencyEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateStablecoinRequestReferenceCurrencyEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateStablecoinRequest extends CreateStablecoinRequest {
  @override
  final String assetCode;
  @override
  final String assetName;
  @override
  final CreateStablecoinRequestClassificationEnum classification;
  @override
  final CreateStablecoinRequestReferenceCurrencyEnum referenceCurrency;
  @override
  final String? issuerLegalEntity;
  @override
  final String? jurisdiction;
  @override
  final String? reserveRatioTarget;

  factory _$CreateStablecoinRequest(
          [void Function(CreateStablecoinRequestBuilder)? updates]) =>
      (CreateStablecoinRequestBuilder()..update(updates))._build();

  _$CreateStablecoinRequest._(
      {required this.assetCode,
      required this.assetName,
      required this.classification,
      required this.referenceCurrency,
      this.issuerLegalEntity,
      this.jurisdiction,
      this.reserveRatioTarget})
      : super._();
  @override
  CreateStablecoinRequest rebuild(
          void Function(CreateStablecoinRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateStablecoinRequestBuilder toBuilder() =>
      CreateStablecoinRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateStablecoinRequest &&
        assetCode == other.assetCode &&
        assetName == other.assetName &&
        classification == other.classification &&
        referenceCurrency == other.referenceCurrency &&
        issuerLegalEntity == other.issuerLegalEntity &&
        jurisdiction == other.jurisdiction &&
        reserveRatioTarget == other.reserveRatioTarget;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, assetCode.hashCode);
    _$hash = $jc(_$hash, assetName.hashCode);
    _$hash = $jc(_$hash, classification.hashCode);
    _$hash = $jc(_$hash, referenceCurrency.hashCode);
    _$hash = $jc(_$hash, issuerLegalEntity.hashCode);
    _$hash = $jc(_$hash, jurisdiction.hashCode);
    _$hash = $jc(_$hash, reserveRatioTarget.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateStablecoinRequest')
          ..add('assetCode', assetCode)
          ..add('assetName', assetName)
          ..add('classification', classification)
          ..add('referenceCurrency', referenceCurrency)
          ..add('issuerLegalEntity', issuerLegalEntity)
          ..add('jurisdiction', jurisdiction)
          ..add('reserveRatioTarget', reserveRatioTarget))
        .toString();
  }
}

class CreateStablecoinRequestBuilder
    implements
        Builder<CreateStablecoinRequest, CreateStablecoinRequestBuilder> {
  _$CreateStablecoinRequest? _$v;

  String? _assetCode;
  String? get assetCode => _$this._assetCode;
  set assetCode(String? assetCode) => _$this._assetCode = assetCode;

  String? _assetName;
  String? get assetName => _$this._assetName;
  set assetName(String? assetName) => _$this._assetName = assetName;

  CreateStablecoinRequestClassificationEnum? _classification;
  CreateStablecoinRequestClassificationEnum? get classification =>
      _$this._classification;
  set classification(
          CreateStablecoinRequestClassificationEnum? classification) =>
      _$this._classification = classification;

  CreateStablecoinRequestReferenceCurrencyEnum? _referenceCurrency;
  CreateStablecoinRequestReferenceCurrencyEnum? get referenceCurrency =>
      _$this._referenceCurrency;
  set referenceCurrency(
          CreateStablecoinRequestReferenceCurrencyEnum? referenceCurrency) =>
      _$this._referenceCurrency = referenceCurrency;

  String? _issuerLegalEntity;
  String? get issuerLegalEntity => _$this._issuerLegalEntity;
  set issuerLegalEntity(String? issuerLegalEntity) =>
      _$this._issuerLegalEntity = issuerLegalEntity;

  String? _jurisdiction;
  String? get jurisdiction => _$this._jurisdiction;
  set jurisdiction(String? jurisdiction) => _$this._jurisdiction = jurisdiction;

  String? _reserveRatioTarget;
  String? get reserveRatioTarget => _$this._reserveRatioTarget;
  set reserveRatioTarget(String? reserveRatioTarget) =>
      _$this._reserveRatioTarget = reserveRatioTarget;

  CreateStablecoinRequestBuilder() {
    CreateStablecoinRequest._defaults(this);
  }

  CreateStablecoinRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _assetCode = $v.assetCode;
      _assetName = $v.assetName;
      _classification = $v.classification;
      _referenceCurrency = $v.referenceCurrency;
      _issuerLegalEntity = $v.issuerLegalEntity;
      _jurisdiction = $v.jurisdiction;
      _reserveRatioTarget = $v.reserveRatioTarget;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateStablecoinRequest other) {
    _$v = other as _$CreateStablecoinRequest;
  }

  @override
  void update(void Function(CreateStablecoinRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateStablecoinRequest build() => _build();

  _$CreateStablecoinRequest _build() {
    final _$result = _$v ??
        _$CreateStablecoinRequest._(
          assetCode: BuiltValueNullFieldError.checkNotNull(
              assetCode, r'CreateStablecoinRequest', 'assetCode'),
          assetName: BuiltValueNullFieldError.checkNotNull(
              assetName, r'CreateStablecoinRequest', 'assetName'),
          classification: BuiltValueNullFieldError.checkNotNull(
              classification, r'CreateStablecoinRequest', 'classification'),
          referenceCurrency: BuiltValueNullFieldError.checkNotNull(
              referenceCurrency,
              r'CreateStablecoinRequest',
              'referenceCurrency'),
          issuerLegalEntity: issuerLegalEntity,
          jurisdiction: jurisdiction,
          reserveRatioTarget: reserveRatioTarget,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
