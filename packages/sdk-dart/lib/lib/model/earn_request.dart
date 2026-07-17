//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'earn_request.g.dart';

/// EarnRequest
///
/// Properties:
/// * [walletId] 
/// * [spendAmount] 
/// * [currency] 
/// * [merchantId] 
@BuiltValue()
abstract class EarnRequest implements Built<EarnRequest, EarnRequestBuilder> {
  @BuiltValueField(wireName: r'walletId')
  String get walletId;

  @BuiltValueField(wireName: r'spendAmount')
  String get spendAmount;

  @BuiltValueField(wireName: r'currency')
  String get currency;

  @BuiltValueField(wireName: r'merchantId')
  String? get merchantId;

  EarnRequest._();

  factory EarnRequest([void updates(EarnRequestBuilder b)]) = _$EarnRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(EarnRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<EarnRequest> get serializer => _$EarnRequestSerializer();
}

class _$EarnRequestSerializer implements PrimitiveSerializer<EarnRequest> {
  @override
  final Iterable<Type> types = const [EarnRequest, _$EarnRequest];

  @override
  final String wireName = r'EarnRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    EarnRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'walletId';
    yield serializers.serialize(
      object.walletId,
      specifiedType: const FullType(String),
    );
    yield r'spendAmount';
    yield serializers.serialize(
      object.spendAmount,
      specifiedType: const FullType(String),
    );
    yield r'currency';
    yield serializers.serialize(
      object.currency,
      specifiedType: const FullType(String),
    );
    if (object.merchantId != null) {
      yield r'merchantId';
      yield serializers.serialize(
        object.merchantId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    EarnRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required EarnRequestBuilder result,
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
        case r'spendAmount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.spendAmount = valueDes;
          break;
        case r'currency':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.currency = valueDes;
          break;
        case r'merchantId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.merchantId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  EarnRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = EarnRequestBuilder();
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

