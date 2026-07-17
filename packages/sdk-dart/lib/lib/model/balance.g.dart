// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'balance.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$Balance extends Balance {
  @override
  final String assetCode;
  @override
  final String issuerPublicKey;
  @override
  final String balance;
  @override
  final DateTime updatedAt;

  factory _$Balance([void Function(BalanceBuilder)? updates]) =>
      (BalanceBuilder()..update(updates))._build();

  _$Balance._(
      {required this.assetCode,
      required this.issuerPublicKey,
      required this.balance,
      required this.updatedAt})
      : super._();
  @override
  Balance rebuild(void Function(BalanceBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BalanceBuilder toBuilder() => BalanceBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Balance &&
        assetCode == other.assetCode &&
        issuerPublicKey == other.issuerPublicKey &&
        balance == other.balance &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, assetCode.hashCode);
    _$hash = $jc(_$hash, issuerPublicKey.hashCode);
    _$hash = $jc(_$hash, balance.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Balance')
          ..add('assetCode', assetCode)
          ..add('issuerPublicKey', issuerPublicKey)
          ..add('balance', balance)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class BalanceBuilder implements Builder<Balance, BalanceBuilder> {
  _$Balance? _$v;

  String? _assetCode;
  String? get assetCode => _$this._assetCode;
  set assetCode(String? assetCode) => _$this._assetCode = assetCode;

  String? _issuerPublicKey;
  String? get issuerPublicKey => _$this._issuerPublicKey;
  set issuerPublicKey(String? issuerPublicKey) =>
      _$this._issuerPublicKey = issuerPublicKey;

  String? _balance;
  String? get balance => _$this._balance;
  set balance(String? balance) => _$this._balance = balance;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  BalanceBuilder() {
    Balance._defaults(this);
  }

  BalanceBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _assetCode = $v.assetCode;
      _issuerPublicKey = $v.issuerPublicKey;
      _balance = $v.balance;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Balance other) {
    _$v = other as _$Balance;
  }

  @override
  void update(void Function(BalanceBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Balance build() => _build();

  _$Balance _build() {
    final _$result = _$v ??
        _$Balance._(
          assetCode: BuiltValueNullFieldError.checkNotNull(
              assetCode, r'Balance', 'assetCode'),
          issuerPublicKey: BuiltValueNullFieldError.checkNotNull(
              issuerPublicKey, r'Balance', 'issuerPublicKey'),
          balance: BuiltValueNullFieldError.checkNotNull(
              balance, r'Balance', 'balance'),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt, r'Balance', 'updatedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
