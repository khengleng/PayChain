//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'burn_request.g.dart';

/// BurnRequest
///
/// Properties:
/// * [walletId] 
/// * [amount] 
@BuiltValue()
abstract class BurnRequest implements Built<BurnRequest, BurnRequestBuilder> {
  @BuiltValueField(wireName: r'walletId')
  String get walletId;

  @BuiltValueField(wireName: r'amount')
  String get amount;

  BurnRequest._();

  factory BurnRequest([void updates(BurnRequestBuilder b)]) = _$BurnRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BurnRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BurnRequest> get serializer => _$BurnRequestSerializer();
}

class _$BurnRequestSerializer implements PrimitiveSerializer<BurnRequest> {
  @override
  final Iterable<Type> types = const [BurnRequest, _$BurnRequest];

  @override
  final String wireName = r'BurnRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BurnRequest object, {
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
  }

  @override
  Object serialize(
    Serializers serializers,
    BurnRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BurnRequestBuilder result,
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BurnRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BurnRequestBuilder();
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

