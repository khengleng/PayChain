// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'earn_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$EarnRequest extends EarnRequest {
  @override
  final String walletId;
  @override
  final String spendAmount;
  @override
  final String currency;
  @override
  final String? merchantId;

  factory _$EarnRequest([void Function(EarnRequestBuilder)? updates]) =>
      (EarnRequestBuilder()..update(updates))._build();

  _$EarnRequest._(
      {required this.walletId,
      required this.spendAmount,
      required this.currency,
      this.merchantId})
      : super._();
  @override
  EarnRequest rebuild(void Function(EarnRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  EarnRequestBuilder toBuilder() => EarnRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is EarnRequest &&
        walletId == other.walletId &&
        spendAmount == other.spendAmount &&
        currency == other.currency &&
        merchantId == other.merchantId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, walletId.hashCode);
    _$hash = $jc(_$hash, spendAmount.hashCode);
    _$hash = $jc(_$hash, currency.hashCode);
    _$hash = $jc(_$hash, merchantId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'EarnRequest')
          ..add('walletId', walletId)
          ..add('spendAmount', spendAmount)
          ..add('currency', currency)
          ..add('merchantId', merchantId))
        .toString();
  }
}

class EarnRequestBuilder implements Builder<EarnRequest, EarnRequestBuilder> {
  _$EarnRequest? _$v;

  String? _walletId;
  String? get walletId => _$this._walletId;
  set walletId(String? walletId) => _$this._walletId = walletId;

  String? _spendAmount;
  String? get spendAmount => _$this._spendAmount;
  set spendAmount(String? spendAmount) => _$this._spendAmount = spendAmount;

  String? _currency;
  String? get currency => _$this._currency;
  set currency(String? currency) => _$this._currency = currency;

  String? _merchantId;
  String? get merchantId => _$this._merchantId;
  set merchantId(String? merchantId) => _$this._merchantId = merchantId;

  EarnRequestBuilder() {
    EarnRequest._defaults(this);
  }

  EarnRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _walletId = $v.walletId;
      _spendAmount = $v.spendAmount;
      _currency = $v.currency;
      _merchantId = $v.merchantId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(EarnRequest other) {
    _$v = other as _$EarnRequest;
  }

  @override
  void update(void Function(EarnRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  EarnRequest build() => _build();

  _$EarnRequest _build() {
    final _$result = _$v ??
        _$EarnRequest._(
          walletId: BuiltValueNullFieldError.checkNotNull(
              walletId, r'EarnRequest', 'walletId'),
          spendAmount: BuiltValueNullFieldError.checkNotNull(
              spendAmount, r'EarnRequest', 'spendAmount'),
          currency: BuiltValueNullFieldError.checkNotNull(
              currency, r'EarnRequest', 'currency'),
          merchantId: merchantId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
