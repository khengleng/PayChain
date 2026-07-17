//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'redemption_request.g.dart';

/// RedemptionRequest
///
/// Properties:
/// * [walletId] 
/// * [amount] 
/// * [bankAccountReference] 
@BuiltValue()
abstract class RedemptionRequest implements Built<RedemptionRequest, RedemptionRequestBuilder> {
  @BuiltValueField(wireName: r'walletId')
  String get walletId;

  @BuiltValueField(wireName: r'amount')
  String get amount;

  @BuiltValueField(wireName: r'bankAccountReference')
  String get bankAccountReference;

  RedemptionRequest._();

  factory RedemptionRequest([void updates(RedemptionRequestBuilder b)]) = _$RedemptionRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RedemptionRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RedemptionRequest> get serializer => _$RedemptionRequestSerializer();
}

class _$RedemptionRequestSerializer implements PrimitiveSerializer<RedemptionRequest> {
  @override
  final Iterable<Type> types = const [RedemptionRequest, _$RedemptionRequest];

  @override
  final String wireName = r'RedemptionRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RedemptionRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'walletId';
    yield serializers.serialize(
      object.walletId,
      specifiedType: const FullType(String),
    );
    yield r'amount';
    yield serializers.serialize(
      object.amount,
      specifiedType: const FullType(String),
    );
    yield r'bankAccountReference';
    yield serializers.serialize(
      object.bankAccountReference,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RedemptionRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RedemptionRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'walletId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.walletId = valueDes;
          break;
        case r'amount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.amount = valueDes;
          break;
        case r'bankAccountReference':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.bankAccountReference = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RedemptionRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RedemptionRequestBuilder();
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

