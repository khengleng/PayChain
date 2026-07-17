// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$Transaction extends Transaction {
  @override
  final String id;
  @override
  final String tenantId;
  @override
  final String type;
  @override
  final String status;
  @override
  final String? assetId;
  @override
  final String? sourceWalletId;
  @override
  final String? destinationWalletId;
  @override
  final String? amount;
  @override
  final String? blockchainHash;
  @override
  final String? compensatesTransactionId;
  @override
  final String? businessReason;
  @override
  final String correlationId;
  @override
  final DateTime createdAt;

  factory _$Transaction([void Function(TransactionBuilder)? updates]) =>
      (TransactionBuilder()..update(updates))._build();

  _$Transaction._(
      {required this.id,
      required this.tenantId,
      required this.type,
      required this.status,
      this.assetId,
      this.sourceWalletId,
      this.destinationWalletId,
      this.amount,
      this.blockchainHash,
      this.compensatesTransactionId,
      this.businessReason,
      required this.correlationId,
      required this.createdAt})
      : super._();
  @override
  Transaction rebuild(void Function(TransactionBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TransactionBuilder toBuilder() => TransactionBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Transaction &&
        id == other.id &&
        tenantId == other.tenantId &&
        type == other.type &&
        status == other.status &&
        assetId == other.assetId &&
        sourceWalletId == other.sourceWalletId &&
        destinationWalletId == other.destinationWalletId &&
        amount == other.amount &&
        blockchainHash == other.blockchainHash &&
        compensatesTransactionId == other.compensatesTransactionId &&
        businessReason == other.businessReason &&
        correlationId == other.correlationId &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, tenantId.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, assetId.hashCode);
    _$hash = $jc(_$hash, sourceWalletId.hashCode);
    _$hash = $jc(_$hash, destinationWalletId.hashCode);
    _$hash = $jc(_$hash, amount.hashCode);
    _$hash = $jc(_$hash, blockchainHash.hashCode);
    _$hash = $jc(_$hash, compensatesTransactionId.hashCode);
    _$hash = $jc(_$hash, businessReason.hashCode);
    _$hash = $jc(_$hash, correlationId.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Transaction')
          ..add('id', id)
          ..add('tenantId', tenantId)
          ..add('type', type)
          ..add('status', status)
          ..add('assetId', assetId)
          ..add('sourceWalletId', sourceWalletId)
          ..add('destinationWalletId', destinationWalletId)
          ..add('amount', amount)
          ..add('blockchainHash', blockchainHash)
          ..add('compensatesTransactionId', compensatesTransactionId)
          ..add('businessReason', businessReason)
          ..add('correlationId', correlationId)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class TransactionBuilder implements Builder<Transaction, TransactionBuilder> {
  _$Transaction? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _tenantId;
  String? get tenantId => _$this._tenantId;
  set tenantId(String? tenantId) => _$this._tenantId = tenantId;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  String? _status;
  String? get status => _$this._status;
  set status(String? status) => _$this._status = status;

  String? _assetId;
  String? get assetId => _$this._assetId;
  set assetId(String? assetId) => _$this._assetId = assetId;

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

  String? _blockchainHash;
  String? get blockchainHash => _$this._blockchainHash;
  set blockchainHash(String? blockchainHash) =>
      _$this._blockchainHash = blockchainHash;

  String? _compensatesTransactionId;
  String? get compensatesTransactionId => _$this._compensatesTransactionId;
  set compensatesTransactionId(String? compensatesTransactionId) =>
      _$this._compensatesTransactionId = compensatesTransactionId;

  String? _businessReason;
  String? get businessReason => _$this._businessReason;
  set businessReason(String? businessReason) =>
      _$this._businessReason = businessReason;

  String? _correlationId;
  String? get correlationId => _$this._correlationId;
  set correlationId(String? correlationId) =>
      _$this._correlationId = correlationId;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  TransactionBuilder() {
    Transaction._defaults(this);
  }

  TransactionBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _tenantId = $v.tenantId;
      _type = $v.type;
      _status = $v.status;
      _assetId = $v.assetId;
      _sourceWalletId = $v.sourceWalletId;
      _destinationWalletId = $v.destinationWalletId;
      _amount = $v.amount;
      _blockchainHash = $v.blockchainHash;
      _compensatesTransactionId = $v.compensatesTransactionId;
      _businessReason = $v.businessReason;
      _correlationId = $v.correlationId;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Transaction other) {
    _$v = other as _$Transaction;
  }

  @override
  void update(void Function(TransactionBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Transaction build() => _build();

  _$Transaction _build() {
    final _$result = _$v ??
        _$Transaction._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'Transaction', 'id'),
          tenantId: BuiltValueNullFieldError.checkNotNull(
              tenantId, r'Transaction', 'tenantId'),
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'Transaction', 'type'),
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'Transaction', 'status'),
          assetId: assetId,
          sourceWalletId: sourceWalletId,
          destinationWalletId: destinationWalletId,
          amount: amount,
          blockchainHash: blockchainHash,
          compensatesTransactionId: compensatesTransactionId,
          businessReason: businessReason,
          correlationId: BuiltValueNullFieldError.checkNotNull(
              correlationId, r'Transaction', 'correlationId'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'Transaction', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
