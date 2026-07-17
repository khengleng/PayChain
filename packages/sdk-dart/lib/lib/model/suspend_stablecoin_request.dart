//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'suspend_stablecoin_request.g.dart';

/// SuspendStablecoinRequest
///
/// Properties:
/// * [mode] 
@BuiltValue()
abstract class SuspendStablecoinRequest implements Built<SuspendStablecoinRequest, SuspendStablecoinRequestBuilder> {
  @BuiltValueField(wireName: r'mode')
  SuspendStablecoinRequestModeEnum get mode;
  // enum modeEnum {  MINTING_SUSPENDED,  REDEMPTION_SUSPENDED,  FULLY_SUSPENDED,  };

  SuspendStablecoinRequest._();

  factory SuspendStablecoinRequest([void updates(SuspendStablecoinRequestBuilder b)]) = _$SuspendStablecoinRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SuspendStablecoinRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SuspendStablecoinRequest> get serializer => _$SuspendStablecoinRequestSerializer();
}

class _$SuspendStablecoinRequestSerializer implements PrimitiveSerializer<SuspendStablecoinRequest> {
  @override
  final Iterable<Type> types = const [SuspendStablecoinRequest, _$SuspendStablecoinRequest];

  @override
  final String wireName = r'SuspendStablecoinRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SuspendStablecoinRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'mode';
    yield serializers.serialize(
      object.mode,
      specifiedType: const FullType(SuspendStablecoinRequestModeEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SuspendStablecoinRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SuspendStablecoinRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'mode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SuspendStablecoinRequestModeEnum),
          ) as SuspendStablecoinRequestModeEnum;
          result.mode = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SuspendStablecoinRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SuspendStablecoinRequestBuilder();
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

class SuspendStablecoinRequestModeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'MINTING_SUSPENDED')
  static const SuspendStablecoinRequestModeEnum MINTING_SUSPENDED = _$suspendStablecoinRequestModeEnum_MINTING_SUSPENDED;
  @BuiltValueEnumConst(wireName: r'REDEMPTION_SUSPENDED')
  static const SuspendStablecoinRequestModeEnum REDEMPTION_SUSPENDED = _$suspendStablecoinRequestModeEnum_REDEMPTION_SUSPENDED;
  @BuiltValueEnumConst(wireName: r'FULLY_SUSPENDED')
  static const SuspendStablecoinRequestModeEnum FULLY_SUSPENDED = _$suspendStablecoinRequestModeEnum_FULLY_SUSPENDED;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const SuspendStablecoinRequestModeEnum unknownDefaultOpenApi = _$suspendStablecoinRequestModeEnum_unknownDefaultOpenApi;

  static Serializer<SuspendStablecoinRequestModeEnum> get serializer => _$suspendStablecoinRequestModeEnumSerializer;

  const SuspendStablecoinRequestModeEnum._(String name): super(name);

  static BuiltSet<SuspendStablecoinRequestModeEnum> get values => _$suspendStablecoinRequestModeEnumValues;
  static SuspendStablecoinRequestModeEnum valueOf(String name) => _$suspendStablecoinRequestModeEnumValueOf(name);
}

