// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transfer_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TransferRequest extends TransferRequest {
  @override
  final String sourceWalletId;
  @override
  final String destinationWalletId;
  @override
  final String amount;

  factory _$TransferRequest([void Function(TransferRequestBuilder)? updates]) =>
      (TransferRequestBuilder()..update(updates))._build();

  _$TransferRequest._(
      {required this.sourceWalletId,
      required this.destinationWalletId,
      required this.amount})
      : super._();
  @override
  TransferRequest rebuild(void Function(TransferRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TransferRequestBuilder toBuilder() => TransferRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TransferRequest &&
        sourceWalletId == other.sourceWalletId &&
        destinationWalletId == other.destinationWalletId &&
        amount == other.amount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, sourceWalletId.hashCode);
    _$hash = $jc(_$hash, destinationWalletId.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TransferRequest')
          ..add('sourceWalletId', sourceWalletId)
          ..add('destinationWalletId', destinationWalletId)
          ..add('amount', amount))
        .toString();
  }
}

class TransferRequestBuilder
    implements Builder<TransferRequest, TransferRequestBuilder> {
  _$TransferRequest? _$v;

  String? _sourceWalletId;
  String? get sourceWalletId => _$this._sourceWalletId;
  set sourceWalletId(String? sourceWalletId) =>
      _$this._sourceWalletId = sourceWalletId;

  String? _destinationWalletId;
  String? get destinationWalletId => _$this._destinationWalletId;
  set destinationWalletId(String? destinationWalletId) =>
      _$this._destinationWalletId = destinationWalletId;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  TransferRequestBuilder() {
    TransferRequest._defaults(this);
  }

  TransferRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _sourceWalletId = $v.sourceWalletId;
      _destinationWalletId = $v.destinationWalletId;
      _amount = $v.amount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TransferRequest other) {
    _$v = other as _$TransferRequest;
  }

  @override
  void update(void Function(TransferRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TransferRequest build() => _build();

  _$TransferRequest _build() {
    final _$result = _$v ??
        _$TransferRequest._(
          sourceWalletId: BuiltValueNullFieldError.checkNotNull(
              sourceWalletId, r'TransferRequest', 'sourceWalletId'),
          destinationWalletId: BuiltValueNullFieldError.checkNotNull(
              destinationWalletId, r'TransferRequest', 'destinationWalletId'),
          amount: BuiltValueNullFieldError.checkNotNull(
              amount, r'TransferRequest', 'amount'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
