//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'health_ready.g.dart';

/// HealthReady
///
/// Properties:
/// * [status] 
/// * [database] 
@BuiltValue()
abstract class HealthReady implements Built<HealthReady, HealthReadyBuilder> {
  @BuiltValueField(wireName: r'status')
  HealthReadyStatusEnum get status;
  // enum statusEnum {  ok,  degraded,  };

  @BuiltValueField(wireName: r'database')
  bool get database;

  HealthReady._();

  factory HealthReady([void updates(HealthReadyBuilder b)]) = _$HealthReady;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(HealthReadyBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<HealthReady> get serializer => _$HealthReadySerializer();
}

class _$HealthReadySerializer implements PrimitiveSerializer<HealthReady> {
  @override
  final Iterable<Type> types = const [HealthReady, _$HealthReady];

  @override
  final String wireName = r'HealthReady';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    HealthReady object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(HealthReadyStatusEnum),
    );
    yield r'database';
    yield serializers.serialize(
      object.database,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    HealthReady object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required HealthReadyBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(HealthReadyStatusEnum),
          ) as HealthReadyStatusEnum;
          result.status = valueDes;
          break;
        case r'database':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.database = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  HealthReady deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = HealthReadyBuilder();
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

class HealthReadyStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'ok')
  static const HealthReadyStatusEnum ok = _$healthReadyStatusEnum_ok;
  @BuiltValueEnumConst(wireName: r'degraded')
  static const HealthReadyStatusEnum degraded = _$healthReadyStatusEnum_degraded;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const HealthReadyStatusEnum unknownDefaultOpenApi = _$healthReadyStatusEnum_unknownDefaultOpenApi;

  static Serializer<HealthReadyStatusEnum> get serializer => _$healthReadyStatusEnumSerializer;

  const HealthReadyStatusEnum._(String name): super(name);

  static BuiltSet<HealthReadyStatusEnum> get values => _$healthReadyStatusEnumValues;
  static HealthReadyStatusEnum valueOf(String name) => _$healthReadyStatusEnumValueOf(name);
}

