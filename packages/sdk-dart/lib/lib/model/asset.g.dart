// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'asset.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$Asset extends Asset {
  @override
  final String id;
  @override
  final String assetCode;
  @override
  final String assetName;
  @override
  final String assetType;
  @override
  final String status;
  @override
  final String issuerPublicKey;
  @override
  final DateTime createdAt;

  factory _$Asset([void Function(AssetBuilder)? updates]) =>
      (AssetBuilder()..update(updates))._build();

  _$Asset._(
      {required this.id,
      required this.assetCode,
      required this.assetName,
      required this.assetType,
      required this.status,
      required this.issuerPublicKey,
      required this.createdAt})
      : super._();
  @override
  Asset rebuild(void Function(AssetBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AssetBuilder toBuilder() => AssetBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Asset &&
        id == other.id &&
        assetCode == other.assetCode &&
        assetName == other.assetName &&
        assetType == other.assetType &&
        status == other.status &&
        issuerPublicKey == other.issuerPublicKey &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, assetCode.hashCode);
    _$hash = $jc(_$hash, assetName.hashCode);
    _$hash = $jc(_$hash, assetType.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, issuerPublicKey.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Asset')
          ..add('id', id)
          ..add('assetCode', assetCode)
          ..add('assetName', assetName)
          ..add('assetType', assetType)
          ..add('status', status)
          ..add('issuerPublicKey', issuerPublicKey)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class AssetBuilder implements Builder<Asset, AssetBuilder> {
  _$Asset? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _assetCode;
  String? get assetCode => _$this._assetCode;
  set assetCode(String? assetCode) => _$this._assetCode = assetCode;

  String? _assetName;
  String? get assetName => _$this._assetName;
  set assetName(String? assetName) => _$this._assetName = assetName;

  String? _assetType;
  String? get assetType => _$this._assetType;
  set assetType(String? assetType) => _$this._assetType = assetType;

  String? _status;
  String? get status => _$this._status;
  set status(String? status) => _$this._status = status;

  String? _issuerPublicKey;
  String? get issuerPublicKey => _$this._issuerPublicKey;
  set issuerPublicKey(String? issuerPublicKey) =>
      _$this._issuerPublicKey = issuerPublicKey;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  AssetBuilder() {
    Asset._defaults(this);
  }

  AssetBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _assetCode = $v.assetCode;
      _assetName = $v.assetName;
      _assetType = $v.assetType;
      _status = $v.status;
      _issuerPublicKey = $v.issuerPublicKey;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Asset other) {
    _$v = other as _$Asset;
  }

  @override
  void update(void Function(AssetBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Asset build() => _build();

  _$Asset _build() {
    final _$result = _$v ??
        _$Asset._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'Asset', 'id'),
          assetCode: BuiltValueNullFieldError.checkNotNull(
              assetCode, r'Asset', 'assetCode'),
          assetName: BuiltValueNullFieldError.checkNotNull(
              assetName, r'Asset', 'assetName'),
          assetType: BuiltValueNullFieldError.checkNotNull(
              assetType, r'Asset', 'assetType'),
          status:
              BuiltValueNullFieldError.checkNotNull(status, r'Asset', 'status'),
          issuerPublicKey: BuiltValueNullFieldError.checkNotNull(
              issuerPublicKey, r'Asset', 'issuerPublicKey'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'Asset', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
