//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'compensation.g.dart';

/// Compensation
///
/// Properties:
/// * [id] 
/// * [status] 
/// * [amount] 
/// * [reason] 
/// * [compensatesTransactionId] 
/// * [blockchainHash] 
/// * [createdAt] 
@BuiltValue()
abstract class Compensation implements Built<Compensation, CompensationBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'status')
  String get status;

  @BuiltValueField(wireName: r'amount')
  String? get amount;

  @BuiltValueField(wireName: r'reason')
  String? get reason;

  @BuiltValueField(wireName: r'compensatesTransactionId')
  String? get compensatesTransactionId;

  @BuiltValueField(wireName: r'blockchainHash')
  String? get blockchainHash;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  Compensation._();

  factory Compensation([void updates(CompensationBuilder b)]) = _$Compensation;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CompensationBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Compensation> get serializer => _$CompensationSerializer();
}

class _$CompensationSerializer implements PrimitiveSerializer<Compensation> {
  @override
  final Iterable<Type> types = const [Compensation, _$Compensation];

  @override
  final String wireName = r'Compensation';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Compensation object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(String),
    );
    if (object.amount != null) {
      yield r'amount';
      yield serializers.serialize(
        object.amount,
        specifiedType: const FullType(String),
      );
    }
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
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
    if (object.blockchainHash != null) {
      yield r'blockchainHash';
      yield serializers.serialize(
        object.blockchainHash,
        specifiedType: const FullType(String),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    Compensation object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CompensationBuilder result,
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
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.status = valueDes;
          break;
        case r'amount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.amount = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reason = valueDes;
          break;
        case r'compensatesTransactionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.compensatesTransactionId = valueDes;
          break;
        case r'blockchainHash':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.blockchainHash = valueDes;
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
  Compensation deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CompensationBuilder();
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

