// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction_record.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TransactionRecord extends TransactionRecord {
  @override
  final String id;
  @override
  final String type;
  @override
  final String status;
  @override
  final String? blockchainHash;
  @override
  final String? amount;
  @override
  final String correlationId;
  @override
  final DateTime createdAt;

  factory _$TransactionRecord(
          [void Function(TransactionRecordBuilder)? updates]) =>
      (TransactionRecordBuilder()..update(updates))._build();

  _$TransactionRecord._(
      {required this.id,
      required this.type,
      required this.status,
      this.blockchainHash,
      this.amount,
      required this.correlationId,
      required this.createdAt})
      : super._();
  @override
  TransactionRecord rebuild(void Function(TransactionRecordBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TransactionRecordBuilder toBuilder() =>
      TransactionRecordBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TransactionRecord &&
        id == other.id &&
        type == other.type &&
        status == other.status &&
        blockchainHash == other.blockchainHash &&
        amount == other.amount &&
        correlationId == other.correlationId &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, blockchainHash.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jc(_$hash, correlationId.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TransactionRecord')
          ..add('id', id)
          ..add('type', type)
          ..add('status', status)
          ..add('blockchainHash', blockchainHash)
          ..add('amount', amount)
          ..add('correlationId', correlationId)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class TransactionRecordBuilder
    implements Builder<TransactionRecord, TransactionRecordBuilder> {
  _$TransactionRecord? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _status;
  String? get status => _$this._status;
  set status(String? status) => _$this._status = status;

  String? _blockchainHash;
  String? get blockchainHash => _$this._blockchainHash;
  set blockchainHash(String? blockchainHash) =>
      _$this._blockchainHash = blockchainHash;

  String? _amount;
  String? get amount => _$this._amount;
  set amount(String? amount) => _$this._amount = amount;

  String? _correlationId;
  String? get correlationId => _$this._correlationId;
  set correlationId(String? correlationId) =>
      _$this._correlationId = correlationId;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  TransactionRecordBuilder() {
    TransactionRecord._defaults(this);
  }

  TransactionRecordBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _type = $v.type;
      _status = $v.status;
      _blockchainHash = $v.blockchainHash;
      _amount = $v.amount;
      _correlationId = $v.correlationId;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TransactionRecord other) {
    _$v = other as _$TransactionRecord;
  }

  @override
  void update(void Function(TransactionRecordBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TransactionRecord build() => _build();

  _$TransactionRecord _build() {
    final _$result = _$v ??
        _$TransactionRecord._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'TransactionRecord', 'id'),
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'TransactionRecord', 'type'),
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'TransactionRecord', 'status'),
          blockchainHash: blockchainHash,
          amount: amount,
          correlationId: BuiltValueNullFieldError.checkNotNull(
              correlationId, r'TransactionRecord', 'correlationId'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'TransactionRecord', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
