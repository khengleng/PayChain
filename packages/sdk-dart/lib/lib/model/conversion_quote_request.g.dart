// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'conversion_quote_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ConversionQuoteRequest extends ConversionQuoteRequest {
  @override
  final String fromAssetId;
  @override
  final String toAssetId;
  @override
  final String walletId;
  @override
  final String pointsAmount;
  @override
  final String? rate;
  @override
  final String? spread;
  @override
  final String? fee;

  factory _$ConversionQuoteRequest(
          [void Function(ConversionQuoteRequestBuilder)? updates]) =>
      (ConversionQuoteRequestBuilder()..update(updates))._build();

  _$ConversionQuoteRequest._(
      {required this.fromAssetId,
      required this.toAssetId,
      required this.walletId,
      required this.pointsAmount,
      this.rate,
      this.spread,
      this.fee})
      : super._();
  @override
  ConversionQuoteRequest rebuild(
          void Function(ConversionQuoteRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ConversionQuoteRequestBuilder toBuilder() =>
      ConversionQuoteRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ConversionQuoteRequest &&
        fromAssetId == other.fromAssetId &&
        toAssetId == other.toAssetId &&
        walletId == other.walletId &&
        pointsAmount == other.pointsAmount &&
        rate == other.rate &&
        spread == other.spread &&
        fee == other.fee;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fromAssetId.hashCode);
    _$hash = $jc(_$hash, toAssetId.hashCode);
    _$hash = $jc(_$hash, walletId.hashCode);
    _$hash = $jc(_$hash, pointsAmount.hashCode);
    _$hash = $jc(_$hash, rate.hashCode);
    _$hash = $jc(_$hash, spread.hashCode);
    _$hash = $jc(_$hash, fee.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ConversionQuoteRequest')
          ..add('fromAssetId', fromAssetId)
          ..add('toAssetId', toAssetId)
          ..add('walletId', walletId)
          ..add('pointsAmount', pointsAmount)
          ..add('rate', rate)
          ..add('spread', spread)
          ..add('fee', fee))
        .toString();
  }
}

class ConversionQuoteRequestBuilder
    implements Builder<ConversionQuoteRequest, ConversionQuoteRequestBuilder> {
  _$ConversionQuoteRequest? _$v;

  String? _fromAssetId;
  String? get fromAssetId => _$this._fromAssetId;
  set fromAssetId(String? fromAssetId) => _$this._fromAssetId = fromAssetId;

  String? _toAssetId;
  String? get toAssetId => _$this._toAssetId;
  set toAssetId(String? toAssetId) => _$this._toAssetId = toAssetId;

  String? _walletId;
  String? get walletId => _$this._walletId;
  set walletId(String? walletId) => _$this._walletId = walletId;

  String? _pointsAmount;
  String? get pointsAmount => _$this._pointsAmount;
  set pointsAmount(String? pointsAmount) => _$this._pointsAmount = pointsAmount;

  String? _rate;
  String? get rate => _$this._rate;
  set rate(String? rate) => _$this._rate = rate;

  String? _spread;
  String? get spread => _$this._spread;
  set spread(String? spread) => _$this._spread = spread;

  String? _fee;
  String? get fee => _$this._fee;
  set fee(String? fee) => _$this._fee = fee;

  ConversionQuoteRequestBuilder() {
    ConversionQuoteRequest._defaults(this);
  }

  ConversionQuoteRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fromAssetId = $v.fromAssetId;
      _toAssetId = $v.toAssetId;
      _walletId = $v.walletId;
      _pointsAmount = $v.pointsAmount;
      _rate = $v.rate;
      _spread = $v.spread;
      _fee = $v.fee;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ConversionQuoteRequest other) {
    _$v = other as _$ConversionQuoteRequest;
  }

  @override
  void update(void Function(ConversionQuoteRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ConversionQuoteRequest build() => _build();

  _$ConversionQuoteRequest _build() {
    final _$result = _$v ??
        _$ConversionQuoteRequest._(
          fromAssetId: BuiltValueNullFieldError.checkNotNull(
              fromAssetId, r'ConversionQuoteRequest', 'fromAssetId'),
          toAssetId: BuiltValueNullFieldError.checkNotNull(
              toAssetId, r'ConversionQuoteRequest', 'toAssetId'),
          walletId: BuiltValueNullFieldError.checkNotNull(
              walletId, r'ConversionQuoteRequest', 'walletId'),
          pointsAmount: BuiltValueNullFieldError.checkNotNull(
              pointsAmount, r'ConversionQuoteRequest', 'pointsAmount'),
          rate: rate,
          spread: spread,
          fee: fee,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
