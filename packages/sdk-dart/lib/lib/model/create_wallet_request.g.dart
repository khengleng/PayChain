// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_wallet_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_CUSTOMER =
    const CreateWalletRequestOwnerTypeEnum._('CUSTOMER');
const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_MERCHANT =
    const CreateWalletRequestOwnerTypeEnum._('MERCHANT');
const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_ORGANIZATION =
    const CreateWalletRequestOwnerTypeEnum._('ORGANIZATION');
const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_TREASURY =
    const CreateWalletRequestOwnerTypeEnum._('TREASURY');
const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_CAMPAIGN =
    const CreateWalletRequestOwnerTypeEnum._('CAMPAIGN');
const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_SYSTEM =
    const CreateWalletRequestOwnerTypeEnum._('SYSTEM');
const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_REDEMPTION =
    const CreateWalletRequestOwnerTypeEnum._('REDEMPTION');
const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_SETTLEMENT =
    const CreateWalletRequestOwnerTypeEnum._('SETTLEMENT');
const CreateWalletRequestOwnerTypeEnum
    _$createWalletRequestOwnerTypeEnum_unknownDefaultOpenApi =
    const CreateWalletRequestOwnerTypeEnum._('unknownDefaultOpenApi');

CreateWalletRequestOwnerTypeEnum _$createWalletRequestOwnerTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'CUSTOMER':
      return _$createWalletRequestOwnerTypeEnum_CUSTOMER;
    case 'MERCHANT':
      return _$createWalletRequestOwnerTypeEnum_MERCHANT;
    case 'ORGANIZATION':
      return _$createWalletRequestOwnerTypeEnum_ORGANIZATION;
    case 'TREASURY':
      return _$createWalletRequestOwnerTypeEnum_TREASURY;
    case 'CAMPAIGN':
      return _$createWalletRequestOwnerTypeEnum_CAMPAIGN;
    case 'SYSTEM':
      return _$createWalletRequestOwnerTypeEnum_SYSTEM;
    case 'REDEMPTION':
      return _$createWalletRequestOwnerTypeEnum_REDEMPTION;
    case 'SETTLEMENT':
      return _$createWalletRequestOwnerTypeEnum_SETTLEMENT;
    case 'unknownDefaultOpenApi':
      return _$createWalletRequestOwnerTypeEnum_unknownDefaultOpenApi;
    default:
      return _$createWalletRequestOwnerTypeEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<CreateWalletRequestOwnerTypeEnum>
    _$createWalletRequestOwnerTypeEnumValues = BuiltSet<
        CreateWalletRequestOwnerTypeEnum>(const <CreateWalletRequestOwnerTypeEnum>[
  _$createWalletRequestOwnerTypeEnum_CUSTOMER,
  _$createWalletRequestOwnerTypeEnum_MERCHANT,
  _$createWalletRequestOwnerTypeEnum_ORGANIZATION,
  _$createWalletRequestOwnerTypeEnum_TREASURY,
  _$createWalletRequestOwnerTypeEnum_CAMPAIGN,
  _$createWalletRequestOwnerTypeEnum_SYSTEM,
  _$createWalletRequestOwnerTypeEnum_REDEMPTION,
  _$createWalletRequestOwnerTypeEnum_SETTLEMENT,
  _$createWalletRequestOwnerTypeEnum_unknownDefaultOpenApi,
]);

Serializer<CreateWalletRequestOwnerTypeEnum>
    _$createWalletRequestOwnerTypeEnumSerializer =
    _$CreateWalletRequestOwnerTypeEnumSerializer();

class _$CreateWalletRequestOwnerTypeEnumSerializer
    implements PrimitiveSerializer<CreateWalletRequestOwnerTypeEnum> {
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
  final Iterable<Type> types = const <Type>[CreateWalletRequestOwnerTypeEnum];
  @override
  final String wireName = 'CreateWalletRequestOwnerTypeEnum';

  @override
  Object serialize(
          Serializers serializers, CreateWalletRequestOwnerTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateWalletRequestOwnerTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateWalletRequestOwnerTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateWalletRequest extends CreateWalletRequest {
  @override
  final CreateWalletRequestOwnerTypeEnum ownerType;
  @override
  final String ownerReference;
  @override
  final String? externalReference;

  factory _$CreateWalletRequest(
          [void Function(CreateWalletRequestBuilder)? updates]) =>
      (CreateWalletRequestBuilder()..update(updates))._build();

  _$CreateWalletRequest._(
      {required this.ownerType,
      required this.ownerReference,
      this.externalReference})
      : super._();
  @override
  CreateWalletRequest rebuild(
          void Function(CreateWalletRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateWalletRequestBuilder toBuilder() =>
      CreateWalletRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateWalletRequest &&
        ownerType == other.ownerType &&
        ownerReference == other.ownerReference &&
        externalReference == other.externalReference;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ownerType.hashCode);
    _$hash = $jc(_$hash, ownerReference.hashCode);
    _$hash = $jc(_$hash, externalReference.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateWalletRequest')
          ..add('ownerType', ownerType)
          ..add('ownerReference', ownerReference)
          ..add('externalReference', externalReference))
        .toString();
  }
}

class CreateWalletRequestBuilder
    implements Builder<CreateWalletRequest, CreateWalletRequestBuilder> {
  _$CreateWalletRequest? _$v;

  CreateWalletRequestOwnerTypeEnum? _ownerType;
  CreateWalletRequestOwnerTypeEnum? get ownerType => _$this._ownerType;
  set ownerType(CreateWalletRequestOwnerTypeEnum? ownerType) =>
      _$this._ownerType = ownerType;

  String? _ownerReference;
  String? get ownerReference => _$this._ownerReference;
  set ownerReference(String? ownerReference) =>
      _$this._ownerReference = ownerReference;

  String? _externalReference;
  String? get externalReference => _$this._externalReference;
  set externalReference(String? externalReference) =>
      _$this._externalReference = externalReference;

  CreateWalletRequestBuilder() {
    CreateWalletRequest._defaults(this);
  }

  CreateWalletRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ownerType = $v.ownerType;
      _ownerReference = $v.ownerReference;
      _externalReference = $v.externalReference;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateWalletRequest other) {
    _$v = other as _$CreateWalletRequest;
  }

  @override
  void update(void Function(CreateWalletRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateWalletRequest build() => _build();

  _$CreateWalletRequest _build() {
    final _$result = _$v ??
        _$CreateWalletRequest._(
          ownerType: BuiltValueNullFieldError.checkNotNull(
              ownerType, r'CreateWalletRequest', 'ownerType'),
          ownerReference: BuiltValueNullFieldError.checkNotNull(
              ownerReference, r'CreateWalletRequest', 'ownerReference'),
          externalReference: externalReference,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
