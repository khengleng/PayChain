// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'redeem_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RedeemRequest extends RedeemRequest {
  @override
  final String sourceWalletId;
  @override
  final String amount;

  factory _$RedeemRequest([void Function(RedeemRequestBuilder)? updates]) =>
      (RedeemRequestBuilder()..update(updates))._build();

  _$RedeemRequest._({required this.sourceWalletId, required this.amount})
      : super._();
  @override
  RedeemRequest rebuild(void Function(RedeemRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RedeemRequestBuilder toBuilder() => RedeemRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RedeemRequest &&
        sourceWalletId == other.sourceWalletId &&
        amount == other.amount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, sourceWalletId.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RedeemRequest')
          ..add('sourceWalletId', sourceWalletId)
          ..add('amount', amount))
        .toString();
  }
}

class RedeemRequestBuilder
    implements Builder<RedeemRequest, RedeemRequestBuilder> {
  _$RedeemRequest? _$v;

  String? _sourceWalletId;
  String? get sourceWalletId => _$this._sourceWalletId;
  set sourceWalletId(String? sourceWalletId) =>
      _$this._sourceWalletId = sourceWalletId;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  RedeemRequestBuilder() {
    RedeemRequest._defaults(this);
  }

  RedeemRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _sourceWalletId = $v.sourceWalletId;
      _amount = $v.amount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RedeemRequest other) {
    _$v = other as _$RedeemRequest;
  }

  @override
  void update(void Function(RedeemRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RedeemRequest build() => _build();

  _$RedeemRequest _build() {
    final _$result = _$v ??
        _$RedeemRequest._(
          sourceWalletId: BuiltValueNullFieldError.checkNotNull(
              sourceWalletId, r'RedeemRequest', 'sourceWalletId'),
          amount: BuiltValueNullFieldError.checkNotNull(
              amount, r'RedeemRequest', 'amount'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
