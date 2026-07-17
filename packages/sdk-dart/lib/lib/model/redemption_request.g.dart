// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'redemption_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RedemptionRequest extends RedemptionRequest {
  @override
  final String walletId;
  @override
  final String amount;
  @override
  final String bankAccountReference;

  factory _$RedemptionRequest(
          [void Function(RedemptionRequestBuilder)? updates]) =>
      (RedemptionRequestBuilder()..update(updates))._build();

  _$RedemptionRequest._(
      {required this.walletId,
      required this.amount,
      required this.bankAccountReference})
      : super._();
  @override
  RedemptionRequest rebuild(void Function(RedemptionRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RedemptionRequestBuilder toBuilder() =>
      RedemptionRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RedemptionRequest &&
        walletId == other.walletId &&
        amount == other.amount &&
        bankAccountReference == other.bankAccountReference;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, walletId.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jc(_$hash, bankAccountReference.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RedemptionRequest')
          ..add('walletId', walletId)
          ..add('amount', amount)
          ..add('bankAccountReference', bankAccountReference))
        .toString();
  }
}

class RedemptionRequestBuilder
    implements Builder<RedemptionRequest, RedemptionRequestBuilder> {
  _$RedemptionRequest? _$v;

  String? _walletId;
  String? get walletId => _$this._walletId;
  set walletId(String? walletId) => _$this._walletId = walletId;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  String? _bankAccountReference;
  String? get bankAccountReference => _$this._bankAccountReference;
  set bankAccountReference(String? bankAccountReference) =>
      _$this._bankAccountReference = bankAccountReference;

  RedemptionRequestBuilder() {
    RedemptionRequest._defaults(this);
  }

  RedemptionRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _walletId = $v.walletId;
      _amount = $v.amount;
      _bankAccountReference = $v.bankAccountReference;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RedemptionRequest other) {
    _$v = other as _$RedemptionRequest;
  }

  @override
  void update(void Function(RedemptionRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RedemptionRequest build() => _build();

  _$RedemptionRequest _build() {
    final _$result = _$v ??
        _$RedemptionRequest._(
          walletId: BuiltValueNullFieldError.checkNotNull(
              walletId, r'RedemptionRequest', 'walletId'),
          amount: BuiltValueNullFieldError.checkNotNull(
              amount, r'RedemptionRequest', 'amount'),
          bankAccountReference: BuiltValueNullFieldError.checkNotNull(
              bankAccountReference,
              r'RedemptionRequest',
              'bankAccountReference'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
