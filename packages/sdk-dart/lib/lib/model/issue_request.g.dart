// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'issue_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$IssueRequest extends IssueRequest {
  @override
  final String destinationWalletId;
  @override
  final String amount;

  factory _$IssueRequest([void Function(IssueRequestBuilder)? updates]) =>
      (IssueRequestBuilder()..update(updates))._build();

  _$IssueRequest._({required this.destinationWalletId, required this.amount})
      : super._();
  @override
  IssueRequest rebuild(void Function(IssueRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  IssueRequestBuilder toBuilder() => IssueRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is IssueRequest &&
        destinationWalletId == other.destinationWalletId &&
        amount == other.amount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, destinationWalletId.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'IssueRequest')
          ..add('destinationWalletId', destinationWalletId)
          ..add('amount', amount))
        .toString();
  }
}

class IssueRequestBuilder
    implements Builder<IssueRequest, IssueRequestBuilder> {
  _$IssueRequest? _$v;

  String? _destinationWalletId;
  String? get destinationWalletId => _$this._destinationWalletId;
  set destinationWalletId(String? destinationWalletId) =>
      _$this._destinationWalletId = destinationWalletId;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  IssueRequestBuilder() {
    IssueRequest._defaults(this);
  }

  IssueRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _destinationWalletId = $v.destinationWalletId;
      _amount = $v.amount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(IssueRequest other) {
    _$v = other as _$IssueRequest;
  }

  @override
  void update(void Function(IssueRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  IssueRequest build() => _build();

  _$IssueRequest _build() {
    final _$result = _$v ??
        _$IssueRequest._(
          destinationWalletId: BuiltValueNullFieldError.checkNotNull(
              destinationWalletId, r'IssueRequest', 'destinationWalletId'),
          amount: BuiltValueNullFieldError.checkNotNull(
              amount, r'IssueRequest', 'amount'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
