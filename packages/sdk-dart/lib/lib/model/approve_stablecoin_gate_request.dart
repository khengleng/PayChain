//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'approve_stablecoin_gate_request.g.dart';

/// ApproveStablecoinGateRequest
///
/// Properties:
/// * [gate] 
/// * [note] 
@BuiltValue()
abstract class ApproveStablecoinGateRequest implements Built<ApproveStablecoinGateRequest, ApproveStablecoinGateRequestBuilder> {
  @BuiltValueField(wireName: r'gate')
  ApproveStablecoinGateRequestGateEnum get gate;
  // enum gateEnum {  LEGAL,  COMPLIANCE,  TREASURY,  RESERVE,  TECHNICAL,  PILOT,  };

  @BuiltValueField(wireName: r'note')
  String? get note;

  ApproveStablecoinGateRequest._();

  factory ApproveStablecoinGateRequest([void updates(ApproveStablecoinGateRequestBuilder b)]) = _$ApproveStablecoinGateRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ApproveStablecoinGateRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ApproveStablecoinGateRequest> get serializer => _$ApproveStablecoinGateRequestSerializer();
}

class _$ApproveStablecoinGateRequestSerializer implements PrimitiveSerializer<ApproveStablecoinGateRequest> {
  @override
  final Iterable<Type> types = const [ApproveStablecoinGateRequest, _$ApproveStablecoinGateRequest];

  @override
  final String wireName = r'ApproveStablecoinGateRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ApproveStablecoinGateRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'gate';
    yield serializers.serialize(
      object.gate,
      specifiedType: const FullType(ApproveStablecoinGateRequestGateEnum),
    );
    if (object.note != null) {
      yield r'note';
      yield serializers.serialize(
        object.note,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ApproveStablecoinGateRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ApproveStablecoinGateRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'gate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ApproveStablecoinGateRequestGateEnum),
          ) as ApproveStablecoinGateRequestGateEnum;
          result.gate = valueDes;
          break;
        case r'note':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.note = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ApproveStablecoinGateRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ApproveStablecoinGateRequestBuilder();
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

class ApproveStablecoinGateRequestGateEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'LEGAL')
  static const ApproveStablecoinGateRequestGateEnum LEGAL = _$approveStablecoinGateRequestGateEnum_LEGAL;
  @BuiltValueEnumConst(wireName: r'COMPLIANCE')
  static const ApproveStablecoinGateRequestGateEnum COMPLIANCE = _$approveStablecoinGateRequestGateEnum_COMPLIANCE;
  @BuiltValueEnumConst(wireName: r'TREASURY')
  static const ApproveStablecoinGateRequestGateEnum TREASURY = _$approveStablecoinGateRequestGateEnum_TREASURY;
  @BuiltValueEnumConst(wireName: r'RESERVE')
  static const ApproveStablecoinGateRequestGateEnum RESERVE = _$approveStablecoinGateRequestGateEnum_RESERVE;
  @BuiltValueEnumConst(wireName: r'TECHNICAL')
  static const ApproveStablecoinGateRequestGateEnum TECHNICAL = _$approveStablecoinGateRequestGateEnum_TECHNICAL;
  @BuiltValueEnumConst(wireName: r'PILOT')
  static const ApproveStablecoinGateRequestGateEnum PILOT = _$approveStablecoinGateRequestGateEnum_PILOT;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const ApproveStablecoinGateRequestGateEnum unknownDefaultOpenApi = _$approveStablecoinGateRequestGateEnum_unknownDefaultOpenApi;

  static Serializer<ApproveStablecoinGateRequestGateEnum> get serializer => _$approveStablecoinGateRequestGateEnumSerializer;

  const ApproveStablecoinGateRequestGateEnum._(String name): super(name);

  static BuiltSet<ApproveStablecoinGateRequestGateEnum> get values => _$approveStablecoinGateRequestGateEnumValues;
  static ApproveStablecoinGateRequestGateEnum valueOf(String name) => _$approveStablecoinGateRequestGateEnumValueOf(name);
}

