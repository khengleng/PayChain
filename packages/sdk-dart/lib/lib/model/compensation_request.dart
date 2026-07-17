//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'compensation_request.g.dart';

/// CompensationRequest
///
/// Properties:
/// * [amount] 
/// * [reason] 
@BuiltValue()
abstract class CompensationRequest implements Built<CompensationRequest, CompensationRequestBuilder> {
  @BuiltValueField(wireName: r'amount')
  String get amount;

  @BuiltValueField(wireName: r'reason')
  CompensationRequestReasonEnum get reason;
  // enum reasonEnum {  MERCHANT_ERROR,  REFUND,  FRAUD,  DUPLICATE_REWARD,  CAMPAIGN_CANCELLATION,  DISPUTE,  MANUAL_CORRECTION,  EXPIRY_CORRECTION,  };

  CompensationRequest._();

  factory CompensationRequest([void updates(CompensationRequestBuilder b)]) = _$CompensationRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CompensationRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CompensationRequest> get serializer => _$CompensationRequestSerializer();
}

class _$CompensationRequestSerializer implements PrimitiveSerializer<CompensationRequest> {
  @override
  final Iterable<Type> types = const [CompensationRequest, _$CompensationRequest];

  @override
  final String wireName = r'CompensationRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CompensationRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'amount';
    yield serializers.serialize(
      object.amount,
      specifiedType: const FullType(String),
    );
    yield r'reason';
    yield serializers.serialize(
      object.reason,
      specifiedType: const FullType(CompensationRequestReasonEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CompensationRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CompensationRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
            specifiedType: const FullType(CompensationRequestReasonEnum),
          ) as CompensationRequestReasonEnum;
          result.reason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CompensationRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CompensationRequestBuilder();
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

class CompensationRequestReasonEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'MERCHANT_ERROR')
  static const CompensationRequestReasonEnum MERCHANT_ERROR = _$compensationRequestReasonEnum_MERCHANT_ERROR;
  @BuiltValueEnumConst(wireName: r'REFUND')
  static const CompensationRequestReasonEnum REFUND = _$compensationRequestReasonEnum_REFUND;
  @BuiltValueEnumConst(wireName: r'FRAUD')
  static const CompensationRequestReasonEnum FRAUD = _$compensationRequestReasonEnum_FRAUD;
  @BuiltValueEnumConst(wireName: r'DUPLICATE_REWARD')
  static const CompensationRequestReasonEnum DUPLICATE_REWARD = _$compensationRequestReasonEnum_DUPLICATE_REWARD;
  @BuiltValueEnumConst(wireName: r'CAMPAIGN_CANCELLATION')
  static const CompensationRequestReasonEnum CAMPAIGN_CANCELLATION = _$compensationRequestReasonEnum_CAMPAIGN_CANCELLATION;
  @BuiltValueEnumConst(wireName: r'DISPUTE')
  static const CompensationRequestReasonEnum DISPUTE = _$compensationRequestReasonEnum_DISPUTE;
  @BuiltValueEnumConst(wireName: r'MANUAL_CORRECTION')
  static const CompensationRequestReasonEnum MANUAL_CORRECTION = _$compensationRequestReasonEnum_MANUAL_CORRECTION;
  @BuiltValueEnumConst(wireName: r'EXPIRY_CORRECTION')
  static const CompensationRequestReasonEnum EXPIRY_CORRECTION = _$compensationRequestReasonEnum_EXPIRY_CORRECTION;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const CompensationRequestReasonEnum unknownDefaultOpenApi = _$compensationRequestReasonEnum_unknownDefaultOpenApi;

  static Serializer<CompensationRequestReasonEnum> get serializer => _$compensationRequestReasonEnumSerializer;

  const CompensationRequestReasonEnum._(String name): super(name);

  static BuiltSet<CompensationRequestReasonEnum> get values => _$compensationRequestReasonEnumValues;
  static CompensationRequestReasonEnum valueOf(String name) => _$compensationRequestReasonEnumValueOf(name);
}

