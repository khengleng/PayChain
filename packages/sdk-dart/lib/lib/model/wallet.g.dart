// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'wallet.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const WalletOwnerTypeEnum _$walletOwnerTypeEnum_CUSTOMER =
    const WalletOwnerTypeEnum._('CUSTOMER');
const WalletOwnerTypeEnum _$walletOwnerTypeEnum_MERCHANT =
    const WalletOwnerTypeEnum._('MERCHANT');
const WalletOwnerTypeEnum _$walletOwnerTypeEnum_ORGANIZATION =
    const WalletOwnerTypeEnum._('ORGANIZATION');
const WalletOwnerTypeEnum _$walletOwnerTypeEnum_TREASURY =
    const WalletOwnerTypeEnum._('TREASURY');
const WalletOwnerTypeEnum _$walletOwnerTypeEnum_CAMPAIGN =
    const WalletOwnerTypeEnum._('CAMPAIGN');
const WalletOwnerTypeEnum _$walletOwnerTypeEnum_SYSTEM =
    const WalletOwnerTypeEnum._('SYSTEM');
const WalletOwnerTypeEnum _$walletOwnerTypeEnum_REDEMPTION =
    const WalletOwnerTypeEnum._('REDEMPTION');
const WalletOwnerTypeEnum _$walletOwnerTypeEnum_SETTLEMENT =
    const WalletOwnerTypeEnum._('SETTLEMENT');
const WalletOwnerTypeEnum _$walletOwnerTypeEnum_unknownDefaultOpenApi =
    const WalletOwnerTypeEnum._('unknownDefaultOpenApi');

WalletOwnerTypeEnum _$walletOwnerTypeEnumValueOf(String name) {
  switch (name) {
    case 'CUSTOMER':
      return _$walletOwnerTypeEnum_CUSTOMER;
    case 'MERCHANT':
      return _$walletOwnerTypeEnum_MERCHANT;
    case 'ORGANIZATION':
      return _$walletOwnerTypeEnum_ORGANIZATION;
    case 'TREASURY':
      return _$walletOwnerTypeEnum_TREASURY;
    case 'CAMPAIGN':
      return _$walletOwnerTypeEnum_CAMPAIGN;
    case 'SYSTEM':
      return _$walletOwnerTypeEnum_SYSTEM;
    case 'REDEMPTION':
      return _$walletOwnerTypeEnum_REDEMPTION;
    case 'SETTLEMENT':
      return _$walletOwnerTypeEnum_SETTLEMENT;
    case 'unknownDefaultOpenApi':
      return _$walletOwnerTypeEnum_unknownDefaultOpenApi;
    default:
      return _$walletOwnerTypeEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<WalletOwnerTypeEnum> _$walletOwnerTypeEnumValues =
    BuiltSet<WalletOwnerTypeEnum>(const <WalletOwnerTypeEnum>[
  _$walletOwnerTypeEnum_CUSTOMER,
  _$walletOwnerTypeEnum_MERCHANT,
  _$walletOwnerTypeEnum_ORGANIZATION,
  _$walletOwnerTypeEnum_TREASURY,
  _$walletOwnerTypeEnum_CAMPAIGN,
  _$walletOwnerTypeEnum_SYSTEM,
  _$walletOwnerTypeEnum_REDEMPTION,
  _$walletOwnerTypeEnum_SETTLEMENT,
  _$walletOwnerTypeEnum_unknownDefaultOpenApi,
]);

Serializer<WalletOwnerTypeEnum> _$walletOwnerTypeEnumSerializer =
    _$WalletOwnerTypeEnumSerializer();

class _$WalletOwnerTypeEnumSerializer
    implements PrimitiveSerializer<WalletOwnerTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'CUSTOMER': 'CUSTOMER',
    'MERCHANT': 'MERCHANT',
    'ORGANIZATION': 'ORGANIZATION',
    'TREASURY': 'TREASURY',
    'CAMPAIGN': 'CAMPAIGN',
    'SYSTEM': 'SYSTEM',
    'REDEMPTION': 'REDEMPTION',
    'SETTLEMENT': 'SETTLEMENT',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'CUSTOMER': 'CUSTOMER',
    'MERCHANT': 'MERCHANT',
    'ORGANIZATION': 'ORGANIZATION',
    'TREASURY': 'TREASURY',
    'CAMPAIGN': 'CAMPAIGN',
    'SYSTEM': 'SYSTEM',
    'REDEMPTION': 'REDEMPTION',
    'SETTLEMENT': 'SETTLEMENT',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[WalletOwnerTypeEnum];
  @override
  final String wireName = 'WalletOwnerTypeEnum';

  @override
  Object serialize(Serializers serializers, WalletOwnerTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  WalletOwnerTypeEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      WalletOwnerTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$Wallet extends Wallet {
  @override
  final String id;
  @override
  final WalletOwnerTypeEnum ownerType;
  @override
  final String ownerReference;
  @override
  final String stellarAccountId;
  @override
  final String status;
  @override
  final DateTime createdAt;

  factory _$Wallet([void Function(WalletBuilder)? updates]) =>
      (WalletBuilder()..update(updates))._build();

  _$Wallet._(
      {required this.id,
      required this.ownerType,
      required this.ownerReference,
      required this.stellarAccountId,
      required this.status,
      required this.createdAt})
      : super._();
  @override
  Wallet rebuild(void Function(WalletBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  WalletBuilder toBuilder() => WalletBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Wallet &&
        id == other.id &&
        ownerType == other.ownerType &&
        ownerReference == other.ownerReference &&
        stellarAccountId == other.stellarAccountId &&
        status == other.status &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, ownerType.hashCode);
    _$hash = $jc(_$hash, ownerReference.hashCode);
    _$hash = $jc(_$hash, stellarAccountId.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Wallet')
          ..add('id', id)
          ..add('ownerType', ownerType)
          ..add('ownerReference', ownerReference)
          ..add('stellarAccountId', stellarAccountId)
          ..add('status', status)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class WalletBuilder implements Builder<Wallet, WalletBuilder> {
  _$Wallet? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  WalletOwnerTypeEnum? _ownerType;
  WalletOwnerTypeEnum? get ownerType => _$this._ownerType;
  set ownerType(WalletOwnerTypeEnum? ownerType) =>
      _$this._ownerType = ownerType;

  String? _ownerReference;
  String? get ownerReference => _$this._ownerReference;
  set ownerReference(String? ownerReference) =>
      _$this._ownerReference = ownerReference;

  String? _stellarAccountId;
  String? get stellarAccountId => _$this._stellarAccountId;
  set stellarAccountId(String? stellarAccountId) =>
      _$this._stellarAccountId = stellarAccountId;

  String? _status;
  String? get status => _$this._status;
  set status(String? status) => _$this._status = status;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  WalletBuilder() {
    Wallet._defaults(this);
  }

  WalletBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _ownerType = $v.ownerType;
      _ownerReference = $v.ownerReference;
      _stellarAccountId = $v.stellarAccountId;
      _status = $v.status;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Wallet other) {
    _$v = other as _$Wallet;
  }

  @override
  void update(void Function(WalletBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Wallet build() => _build();

  _$Wallet _build() {
    final _$result = _$v ??
        _$Wallet._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'Wallet', 'id'),
          ownerType: BuiltValueNullFieldError.checkNotNull(
              ownerType, r'Wallet', 'ownerType'),
          ownerReference: BuiltValueNullFieldError.checkNotNull(
              ownerReference, r'Wallet', 'ownerReference'),
          stellarAccountId: BuiltValueNullFieldError.checkNotNull(
              stellarAccountId, r'Wallet', 'stellarAccountId'),
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'Wallet', 'status'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'Wallet', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
