// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stablecoin.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const StablecoinReferenceCurrencyEnum _$stablecoinReferenceCurrencyEnum_USD =
    const StablecoinReferenceCurrencyEnum._('USD');
const StablecoinReferenceCurrencyEnum _$stablecoinReferenceCurrencyEnum_KHR =
    const StablecoinReferenceCurrencyEnum._('KHR');
const StablecoinReferenceCurrencyEnum
    _$stablecoinReferenceCurrencyEnum_unknownDefaultOpenApi =
    const StablecoinReferenceCurrencyEnum._('unknownDefaultOpenApi');

StablecoinReferenceCurrencyEnum _$stablecoinReferenceCurrencyEnumValueOf(
    String name) {
  switch (name) {
    case 'USD':
      return _$stablecoinReferenceCurrencyEnum_USD;
    case 'KHR':
      return _$stablecoinReferenceCurrencyEnum_KHR;
    case 'unknownDefaultOpenApi':
      return _$stablecoinReferenceCurrencyEnum_unknownDefaultOpenApi;
    default:
      return _$stablecoinReferenceCurrencyEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<StablecoinReferenceCurrencyEnum>
    _$stablecoinReferenceCurrencyEnumValues = BuiltSet<
        StablecoinReferenceCurrencyEnum>(const <StablecoinReferenceCurrencyEnum>[
  _$stablecoinReferenceCurrencyEnum_USD,
  _$stablecoinReferenceCurrencyEnum_KHR,
  _$stablecoinReferenceCurrencyEnum_unknownDefaultOpenApi,
]);

Serializer<StablecoinReferenceCurrencyEnum>
    _$stablecoinReferenceCurrencyEnumSerializer =
    _$StablecoinReferenceCurrencyEnumSerializer();

class _$StablecoinReferenceCurrencyEnumSerializer
    implements PrimitiveSerializer<StablecoinReferenceCurrencyEnum> {
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
  final Iterable<Type> types = const <Type>[StablecoinReferenceCurrencyEnum];
  @override
  final String wireName = 'StablecoinReferenceCurrencyEnum';

  @override
  Object serialize(
          Serializers serializers, StablecoinReferenceCurrencyEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  StablecoinReferenceCurrencyEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      StablecoinReferenceCurrencyEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$Stablecoin extends Stablecoin {
  @override
  final String id;
  @override
  final String assetId;
  @override
  final String assetCode;
  @override
  final String classification;
  @override
  final StablecoinReferenceCurrencyEnum referenceCurrency;
  @override
  final String lifecycleState;
  @override
  final String activationStatus;
  @override
  final String reserveRatioTarget;
  @override
  final String? jurisdiction;
  @override
  final DateTime createdAt;

  factory _$Stablecoin([void Function(StablecoinBuilder)? updates]) =>
      (StablecoinBuilder()..update(updates))._build();

  _$Stablecoin._(
      {required this.id,
      required this.assetId,
      required this.assetCode,
      required this.classification,
      required this.referenceCurrency,
      required this.lifecycleState,
      required this.activationStatus,
      required this.reserveRatioTarget,
      this.jurisdiction,
      required this.createdAt})
      : super._();
  @override
  Stablecoin rebuild(void Function(StablecoinBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StablecoinBuilder toBuilder() => StablecoinBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Stablecoin &&
        id == other.id &&
        assetId == other.assetId &&
        assetCode == other.assetCode &&
        classification == other.classification &&
        referenceCurrency == other.referenceCurrency &&
        lifecycleState == other.lifecycleState &&
        activationStatus == other.activationStatus &&
        reserveRatioTarget == other.reserveRatioTarget &&
        jurisdiction == other.jurisdiction &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, assetId.hashCode);
    _$hash = $jc(_$hash, assetCode.hashCode);
    _$hash = $jc(_$hash, classification.hashCode);
    _$hash = $jc(_$hash, referenceCurrency.hashCode);
    _$hash = $jc(_$hash, lifecycleState.hashCode);
    _$hash = $jc(_$hash, activationStatus.hashCode);
    _$hash = $jc(_$hash, reserveRatioTarget.hashCode);
    _$hash = $jc(_$hash, jurisdiction.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Stablecoin')
          ..add('id', id)
          ..add('assetId', assetId)
          ..add('assetCode', assetCode)
          ..add('classification', classification)
          ..add('referenceCurrency', referenceCurrency)
          ..add('lifecycleState', lifecycleState)
          ..add('activationStatus', activationStatus)
          ..add('reserveRatioTarget', reserveRatioTarget)
          ..add('jurisdiction', jurisdiction)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class StablecoinBuilder implements Builder<Stablecoin, StablecoinBuilder> {
  _$Stablecoin? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _assetId;
  String? get assetId => _$this._assetId;
  set assetId(String? assetId) => _$this._assetId = assetId;

  String? _assetCode;
  String? get assetCode => _$this._assetCode;
  set assetCode(String? assetCode) => _$this._assetCode = assetCode;

  String? _classification;
  String? get classification => _$this._classification;
  set classification(String? classification) =>
      _$this._classification = classification;

  StablecoinReferenceCurrencyEnum? _referenceCurrency;
  StablecoinReferenceCurrencyEnum? get referenceCurrency =>
      _$this._referenceCurrency;
  set referenceCurrency(StablecoinReferenceCurrencyEnum? referenceCurrency) =>
      _$this._referenceCurrency = referenceCurrency;

  String? _lifecycleState;
  String? get lifecycleState => _$this._lifecycleState;
  set lifecycleState(String? lifecycleState) =>
      _$this._lifecycleState = lifecycleState;

  String? _activationStatus;
  String? get activationStatus => _$this._activationStatus;
  set activationStatus(String? activationStatus) =>
      _$this._activationStatus = activationStatus;

  String? _reserveRatioTarget;
  String? get reserveRatioTarget => _$this._reserveRatioTarget;
  set reserveRatioTarget(String? reserveRatioTarget) =>
      _$this._reserveRatioTarget = reserveRatioTarget;

  String? _jurisdiction;
  String? get jurisdiction => _$this._jurisdiction;
  set jurisdiction(String? jurisdiction) => _$this._jurisdiction = jurisdiction;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  StablecoinBuilder() {
    Stablecoin._defaults(this);
  }

  StablecoinBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _assetId = $v.assetId;
      _assetCode = $v.assetCode;
      _classification = $v.classification;
      _referenceCurrency = $v.referenceCurrency;
      _lifecycleState = $v.lifecycleState;
      _activationStatus = $v.activationStatus;
      _reserveRatioTarget = $v.reserveRatioTarget;
      _jurisdiction = $v.jurisdiction;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Stablecoin other) {
    _$v = other as _$Stablecoin;
  }

  @override
  void update(void Function(StablecoinBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Stablecoin build() => _build();

  _$Stablecoin _build() {
    final _$result = _$v ??
        _$Stablecoin._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'Stablecoin', 'id'),
          assetId: BuiltValueNullFieldError.checkNotNull(
              assetId, r'Stablecoin', 'assetId'),
          assetCode: BuiltValueNullFieldError.checkNotNull(
              assetCode, r'Stablecoin', 'assetCode'),
          classification: BuiltValueNullFieldError.checkNotNull(
              classification, r'Stablecoin', 'classification'),
          referenceCurrency: BuiltValueNullFieldError.checkNotNull(
              referenceCurrency, r'Stablecoin', 'referenceCurrency'),
          lifecycleState: BuiltValueNullFieldError.checkNotNull(
              lifecycleState, r'Stablecoin', 'lifecycleState'),
          activationStatus: BuiltValueNullFieldError.checkNotNull(
              activationStatus, r'Stablecoin', 'activationStatus'),
          reserveRatioTarget: BuiltValueNullFieldError.checkNotNull(
              reserveRatioTarget, r'Stablecoin', 'reserveRatioTarget'),
          jurisdiction: jurisdiction,
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'Stablecoin', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
