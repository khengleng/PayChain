// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'burn_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BurnRequest extends BurnRequest {
  @override
  final String walletId;
  @override
  final String amount;

  factory _$BurnRequest([void Function(BurnRequestBuilder)? updates]) =>
      (BurnRequestBuilder()..update(updates))._build();

  _$BurnRequest._({required this.walletId, required this.amount}) : super._();
  @override
  BurnRequest rebuild(void Function(BurnRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BurnRequestBuilder toBuilder() => BurnRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BurnRequest &&
        walletId == other.walletId &&
        amount == other.amount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, walletId.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BurnRequest')
          ..add('walletId', walletId)
          ..add('amount', amount))
        .toString();
  }
}

class BurnRequestBuilder implements Builder<BurnRequest, BurnRequestBuilder> {
  _$BurnRequest? _$v;

  String? _walletId;
  String? get walletId => _$this._walletId;
  set walletId(String? walletId) => _$this._walletId = walletId;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  BurnRequestBuilder() {
    BurnRequest._defaults(this);
  }

  BurnRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _walletId = $v.walletId;
      _amount = $v.amount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BurnRequest other) {
    _$v = other as _$BurnRequest;
  }

  @override
  void update(void Function(BurnRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BurnRequest build() => _build();

  _$BurnRequest _build() {
    final _$result = _$v ??
        _$BurnRequest._(
          walletId: BuiltValueNullFieldError.checkNotNull(
              walletId, r'BurnRequest', 'walletId'),
          amount: BuiltValueNullFieldError.checkNotNull(
              amount, r'BurnRequest', 'amount'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
