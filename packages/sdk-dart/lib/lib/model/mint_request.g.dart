// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mint_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MintRequest extends MintRequest {
  @override
  final String destinationWalletId;
  @override
  final String amount;
  @override
  final String? fundingReference;

  factory _$MintRequest([void Function(MintRequestBuilder)? updates]) =>
      (MintRequestBuilder()..update(updates))._build();

  _$MintRequest._(
      {required this.destinationWalletId,
      required this.amount,
      this.fundingReference})
      : super._();
  @override
  MintRequest rebuild(void Function(MintRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MintRequestBuilder toBuilder() => MintRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MintRequest &&
        destinationWalletId == other.destinationWalletId &&
        amount == other.amount &&
        fundingReference == other.fundingReference;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, destinationWalletId.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jc(_$hash, fundingReference.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MintRequest')
          ..add('destinationWalletId', destinationWalletId)
          ..add('amount', amount)
          ..add('fundingReference', fundingReference))
        .toString();
  }
}

class MintRequestBuilder implements Builder<MintRequest, MintRequestBuilder> {
  _$MintRequest? _$v;

  String? _destinationWalletId;
  String? get destinationWalletId => _$this._destinationWalletId;
  set destinationWalletId(String? destinationWalletId) =>
      _$this._destinationWalletId = destinationWalletId;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  String? _fundingReference;
  String? get fundingReference => _$this._fundingReference;
  set fundingReference(String? fundingReference) =>
      _$this._fundingReference = fundingReference;

  MintRequestBuilder() {
    MintRequest._defaults(this);
  }

  MintRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _destinationWalletId = $v.destinationWalletId;
      _amount = $v.amount;
      _fundingReference = $v.fundingReference;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MintRequest other) {
    _$v = other as _$MintRequest;
  }

  @override
  void update(void Function(MintRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MintRequest build() => _build();

  _$MintRequest _build() {
    final _$result = _$v ??
        _$MintRequest._(
          destinationWalletId: BuiltValueNullFieldError.checkNotNull(
              destinationWalletId, r'MintRequest', 'destinationWalletId'),
          amount: BuiltValueNullFieldError.checkNotNull(
              amount, r'MintRequest', 'amount'),
          fundingReference: fundingReference,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
