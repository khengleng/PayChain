// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_asset_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const CreateAssetRequestAssetTypeEnum
    _$createAssetRequestAssetTypeEnum_LOYALTY_POINT =
    const CreateAssetRequestAssetTypeEnum._('LOYALTY_POINT');
const CreateAssetRequestAssetTypeEnum
    _$createAssetRequestAssetTypeEnum_unknownDefaultOpenApi =
    const CreateAssetRequestAssetTypeEnum._('unknownDefaultOpenApi');

CreateAssetRequestAssetTypeEnum _$createAssetRequestAssetTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'LOYALTY_POINT':
      return _$createAssetRequestAssetTypeEnum_LOYALTY_POINT;
    case 'unknownDefaultOpenApi':
      return _$createAssetRequestAssetTypeEnum_unknownDefaultOpenApi;
    default:
      return _$createAssetRequestAssetTypeEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<CreateAssetRequestAssetTypeEnum>
    _$createAssetRequestAssetTypeEnumValues = BuiltSet<
        CreateAssetRequestAssetTypeEnum>(const <CreateAssetRequestAssetTypeEnum>[
  _$createAssetRequestAssetTypeEnum_LOYALTY_POINT,
  _$createAssetRequestAssetTypeEnum_unknownDefaultOpenApi,
]);

const CreateAssetRequestExpiryPolicyEnum
    _$createAssetRequestExpiryPolicyEnum_NONE =
    const CreateAssetRequestExpiryPolicyEnum._('NONE');
const CreateAssetRequestExpiryPolicyEnum
    _$createAssetRequestExpiryPolicyEnum_FIXED =
    const CreateAssetRequestExpiryPolicyEnum._('FIXED');
const CreateAssetRequestExpiryPolicyEnum
    _$createAssetRequestExpiryPolicyEnum_ROLLING =
    const CreateAssetRequestExpiryPolicyEnum._('ROLLING');
const CreateAssetRequestExpiryPolicyEnum
    _$createAssetRequestExpiryPolicyEnum_unknownDefaultOpenApi =
    const CreateAssetRequestExpiryPolicyEnum._('unknownDefaultOpenApi');

CreateAssetRequestExpiryPolicyEnum _$createAssetRequestExpiryPolicyEnumValueOf(
    String name) {
  switch (name) {
    case 'NONE':
      return _$createAssetRequestExpiryPolicyEnum_NONE;
    case 'FIXED':
      return _$createAssetRequestExpiryPolicyEnum_FIXED;
    case 'ROLLING':
      return _$createAssetRequestExpiryPolicyEnum_ROLLING;
    case 'unknownDefaultOpenApi':
      return _$createAssetRequestExpiryPolicyEnum_unknownDefaultOpenApi;
    default:
      return _$createAssetRequestExpiryPolicyEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<CreateAssetRequestExpiryPolicyEnum>
    _$createAssetRequestExpiryPolicyEnumValues = BuiltSet<
        CreateAssetRequestExpiryPolicyEnum>(const <CreateAssetRequestExpiryPolicyEnum>[
  _$createAssetRequestExpiryPolicyEnum_NONE,
  _$createAssetRequestExpiryPolicyEnum_FIXED,
  _$createAssetRequestExpiryPolicyEnum_ROLLING,
  _$createAssetRequestExpiryPolicyEnum_unknownDefaultOpenApi,
]);

Serializer<CreateAssetRequestAssetTypeEnum>
    _$createAssetRequestAssetTypeEnumSerializer =
    _$CreateAssetRequestAssetTypeEnumSerializer();
Serializer<CreateAssetRequestExpiryPolicyEnum>
    _$createAssetRequestExpiryPolicyEnumSerializer =
    _$CreateAssetRequestExpiryPolicyEnumSerializer();

class _$CreateAssetRequestAssetTypeEnumSerializer
    implements PrimitiveSerializer<CreateAssetRequestAssetTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'LOYALTY_POINT': 'LOYALTY_POINT',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'LOYALTY_POINT': 'LOYALTY_POINT',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[CreateAssetRequestAssetTypeEnum];
  @override
  final String wireName = 'CreateAssetRequestAssetTypeEnum';

  @override
  Object serialize(
          Serializers serializers, CreateAssetRequestAssetTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateAssetRequestAssetTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateAssetRequestAssetTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateAssetRequestExpiryPolicyEnumSerializer
    implements PrimitiveSerializer<CreateAssetRequestExpiryPolicyEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'NONE': 'NONE',
    'FIXED': 'FIXED',
    'ROLLING': 'ROLLING',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'NONE': 'NONE',
    'FIXED': 'FIXED',
    'ROLLING': 'ROLLING',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[CreateAssetRequestExpiryPolicyEnum];
  @override
  final String wireName = 'CreateAssetRequestExpiryPolicyEnum';

  @override
  Object serialize(
          Serializers serializers, CreateAssetRequestExpiryPolicyEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  CreateAssetRequestExpiryPolicyEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      CreateAssetRequestExpiryPolicyEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$CreateAssetRequest extends CreateAssetRequest {
  @override
  final String assetCode;
  @override
  final String assetName;
  @override
  final CreateAssetRequestAssetTypeEnum? assetType;
  @override
  final CreateAssetRequestExpiryPolicyEnum? expiryPolicy;
  @override
  final int? expiryDays;

  factory _$CreateAssetRequest(
          [void Function(CreateAssetRequestBuilder)? updates]) =>
      (CreateAssetRequestBuilder()..update(updates))._build();

  _$CreateAssetRequest._(
      {required this.assetCode,
      required this.assetName,
      this.assetType,
      this.expiryPolicy,
      this.expiryDays})
      : super._();
  @override
  CreateAssetRequest rebuild(
          void Function(CreateAssetRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateAssetRequestBuilder toBuilder() =>
      CreateAssetRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateAssetRequest &&
        assetCode == other.assetCode &&
        assetName == other.assetName &&
        assetType == other.assetType &&
        expiryPolicy == other.expiryPolicy &&
        expiryDays == other.expiryDays;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, assetCode.hashCode);
    _$hash = $jc(_$hash, assetName.hashCode);
    _$hash = $jc(_$hash, assetType.hashCode);
    _$hash = $jc(_$hash, expiryPolicy.hashCode);
    _$hash = $jc(_$hash, expiryDays.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateAssetRequest')
          ..add('assetCode', assetCode)
          ..add('assetName', assetName)
          ..add('assetType', assetType)
          ..add('expiryPolicy', expiryPolicy)
          ..add('expiryDays', expiryDays))
        .toString();
  }
}

class CreateAssetRequestBuilder
    implements Builder<CreateAssetRequest, CreateAssetRequestBuilder> {
  _$CreateAssetRequest? _$v;

  String? _assetCode;
  String? get assetCode => _$this._assetCode;
  set assetCode(String? assetCode) => _$this._assetCode = assetCode;

  String? _assetName;
  String? get assetName => _$this._assetName;
  set assetName(String? assetName) => _$this._assetName = assetName;

  CreateAssetRequestAssetTypeEnum? _assetType;
  CreateAssetRequestAssetTypeEnum? get assetType => _$this._assetType;
  set assetType(CreateAssetRequestAssetTypeEnum? assetType) =>
      _$this._assetType = assetType;

  CreateAssetRequestExpiryPolicyEnum? _expiryPolicy;
  CreateAssetRequestExpiryPolicyEnum? get expiryPolicy => _$this._expiryPolicy;
  set expiryPolicy(CreateAssetRequestExpiryPolicyEnum? expiryPolicy) =>
      _$this._expiryPolicy = expiryPolicy;

  int? _expiryDays;
  int? get expiryDays => _$this._expiryDays;
  set expiryDays(int? expiryDays) => _$this._expiryDays = expiryDays;

  CreateAssetRequestBuilder() {
    CreateAssetRequest._defaults(this);
  }

  CreateAssetRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _assetCode = $v.assetCode;
      _assetName = $v.assetName;
      _assetType = $v.assetType;
      _expiryPolicy = $v.expiryPolicy;
      _expiryDays = $v.expiryDays;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateAssetRequest other) {
    _$v = other as _$CreateAssetRequest;
  }

  @override
  void update(void Function(CreateAssetRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateAssetRequest build() => _build();

  _$CreateAssetRequest _build() {
    final _$result = _$v ??
        _$CreateAssetRequest._(
          assetCode: BuiltValueNullFieldError.checkNotNull(
              assetCode, r'CreateAssetRequest', 'assetCode'),
          assetName: BuiltValueNullFieldError.checkNotNull(
              assetName, r'CreateAssetRequest', 'assetName'),
          assetType: assetType,
          expiryPolicy: expiryPolicy,
          expiryDays: expiryDays,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
