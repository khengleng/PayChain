//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transaction_record.g.dart';

/// TransactionRecord
///
/// Properties:
/// * [id] 
/// * [type] 
/// * [status] 
/// * [blockchainHash] 
/// * [amount] 
/// * [correlationId] 
/// * [createdAt] 
@BuiltValue()
abstract class TransactionRecord implements Built<TransactionRecord, TransactionRecordBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'type')
  String get type;

  @BuiltValueField(wireName: r'status')
  String get status;

  @BuiltValueField(wireName: r'blockchainHash')
  String? get blockchainHash;

  @BuiltValueField(wireName: r'amount')
  String? get amount;

  @BuiltValueField(wireName: r'correlationId')
  String get correlationId;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  TransactionRecord._();

  factory TransactionRecord([void updates(TransactionRecordBuilder b)]) = _$TransactionRecord;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TransactionRecordBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TransactionRecord> get serializer => _$TransactionRecordSerializer();
}

class _$TransactionRecordSerializer implements PrimitiveSerializer<TransactionRecord> {
  @override
  final Iterable<Type> types = const [TransactionRecord, _$TransactionRecord];

  @override
  final String wireName = r'TransactionRecord';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TransactionRecord object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
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
    if (object.blockchainHash != null) {
      yield r'blockchainHash';
      yield serializers.serialize(
        object.blockchainHash,
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
    TransactionRecord object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TransactionRecordBuilder result,
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
        case r'blockchainHash':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.blockchainHash = valueDes;
          break;
        case r'amount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.amount = valueDes;
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
  TransactionRecord deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TransactionRecordBuilder();
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

