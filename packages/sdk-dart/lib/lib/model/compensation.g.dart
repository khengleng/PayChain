// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'compensation.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$Compensation extends Compensation {
  @override
  final String id;
  @override
  final String status;
  @override
  final String? amount;
  @override
  final String? reason;
  @override
  final String? compensatesTransactionId;
  @override
  final String? blockchainHash;
  @override
  final DateTime createdAt;

  factory _$Compensation([void Function(CompensationBuilder)? updates]) =>
      (CompensationBuilder()..update(updates))._build();

  _$Compensation._(
      {required this.id,
      required this.status,
      this.amount,
      this.reason,
      this.compensatesTransactionId,
      this.blockchainHash,
      required this.createdAt})
      : super._();
  @override
  Compensation rebuild(void Function(CompensationBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CompensationBuilder toBuilder() => CompensationBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Compensation &&
        id == other.id &&
        status == other.status &&
        amount == other.amount &&
        reason == other.reason &&
        compensatesTransactionId == other.compensatesTransactionId &&
        blockchainHash == other.blockchainHash &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, compensatesTransactionId.hashCode);
    _$hash = $jc(_$hash, blockchainHash.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Compensation')
          ..add('id', id)
          ..add('status', status)
          ..add('amount', amount)
          ..add('reason', reason)
          ..add('compensatesTransactionId', compensatesTransactionId)
          ..add('blockchainHash', blockchainHash)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class CompensationBuilder
    implements Builder<Compensation, CompensationBuilder> {
  _$Compensation? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _status;
  String? get status => _$this._status;
  set status(String? status) => _$this._status = status;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  String? _compensatesTransactionId;
  String? get compensatesTransactionId => _$this._compensatesTransactionId;
  set compensatesTransactionId(String? compensatesTransactionId) =>
      _$this._compensatesTransactionId = compensatesTransactionId;

  String? _blockchainHash;
  String? get blockchainHash => _$this._blockchainHash;
  set blockchainHash(String? blockchainHash) =>
      _$this._blockchainHash = blockchainHash;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  CompensationBuilder() {
    Compensation._defaults(this);
  }

  CompensationBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _status = $v.status;
      _amount = $v.amount;
      _reason = $v.reason;
      _compensatesTransactionId = $v.compensatesTransactionId;
      _blockchainHash = $v.blockchainHash;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Compensation other) {
    _$v = other as _$Compensation;
  }

  @override
  void update(void Function(CompensationBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Compensation build() => _build();

  _$Compensation _build() {
    final _$result = _$v ??
        _$Compensation._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'Compensation', 'id'),
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'Compensation', 'status'),
          amount: amount,
          reason: reason,
          compensatesTransactionId: compensatesTransactionId,
          blockchainHash: blockchainHash,
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'Compensation', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
