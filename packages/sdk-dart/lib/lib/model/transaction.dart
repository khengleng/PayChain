//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transaction.g.dart';

/// Transaction
///
/// Properties:
/// * [id] 
/// * [tenantId] 
/// * [type] 
/// * [status] 
/// * [assetId] 
/// * [sourceWalletId] 
/// * [destinationWalletId] 
/// * [amount] 
/// * [blockchainHash] 
/// * [compensatesTransactionId] 
/// * [businessReason] 
/// * [correlationId] 
/// * [createdAt] 
@BuiltValue()
abstract class Transaction implements Built<Transaction, TransactionBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'tenantId')
  String get tenantId;

  @BuiltValueField(wireName: r'type')
  String get type;

  @BuiltValueField(wireName: r'status')
  String get status;

  @BuiltValueField(wireName: r'assetId')
  String? get assetId;

  @BuiltValueField(wireName: r'sourceWalletId')
  String? get sourceWalletId;

  @BuiltValueField(wireName: r'destinationWalletId')
  String? get destinationWalletId;

  @BuiltValueField(wireName: r'amount')
  String? get amount;

  @BuiltValueField(wireName: r'blockchainHash')
  String? get blockchainHash;

  @BuiltValueField(wireName: r'compensatesTransactionId')
  String? get compensatesTransactionId;

  @BuiltValueField(wireName: r'businessReason')
  String? get businessReason;

  @BuiltValueField(wireName: r'correlationId')
  String get correlationId;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  Transaction._();

  factory Transaction([void updates(TransactionBuilder b)]) = _$Transaction;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TransactionBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Transaction> get serializer => _$TransactionSerializer();
}

class _$TransactionSerializer implements PrimitiveSerializer<Transaction> {
  @override
  final Iterable<Type> types = const [Transaction, _$Transaction];

  @override
  final String wireName = r'Transaction';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Transaction object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'tenantId';
    yield serializers.serialize(
      object.tenantId,
      specifiedType: const FullType(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(String),
    );
    if (object.assetId != null) {
      yield r'assetId';
      yield serializers.serialize(
        object.assetId,
        specifiedType: const FullType(String),
      );
    }
    if (object.sourceWalletId != null) {
      yield r'sourceWalletId';
      yield serializers.serialize(
        object.sourceWalletId,
        specifiedType: const FullType(String),
      );
    }
    if (object.destinationWalletId != null) {
      yield r'destinationWalletId';
      yield serializers.serialize(
        object.destinationWalletId,
        specifiedType: const FullType(String),
      );
    }
    if (object.amount != null) {
      yield r'amount';
      yield serializers.serialize(
        object.amount,
        specifiedType: const FullType(String),
      );
    }
    if (object.blockchainHash != null) {
      yield r'blockchainHash';
      yield serializers.serialize(
        object.blockchainHash,
        specifiedType: const FullType(String),
      );
    }
    if (object.compensatesTransactionId != null) {
      yield r'compensatesTransactionId';
      yield serializers.serialize(
        object.compensatesTransactionId,
        specifiedType: const FullType(String),
      );
    }
    if (object.businessReason != null) {
      yield r'businessReason';
      yield serializers.serialize(
        object.businessReason,
        specifiedType: const FullType(String),
      );
    }
    yield r'correlationId';
    yield serializers.serialize(
      object.correlationId,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    Transaction object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TransactionBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'tenantId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.tenantId = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.type = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.status = valueDes;
          break;
        case r'assetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetId = valueDes;
          break;
        case r'sourceWalletId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sourceWalletId = valueDes;
          break;
        case r'destinationWalletId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.destinationWalletId = valueDes;
          break;
        case r'amount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.amount = valueDes;
          break;
        case r'blockchainHash':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.blockchainHash = valueDes;
          break;
        case r'compensatesTransactionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.compensatesTransactionId = valueDes;
          break;
        case r'businessReason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.businessReason = valueDes;
          break;
        case r'correlationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.correlationId = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  Transaction deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TransactionBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

