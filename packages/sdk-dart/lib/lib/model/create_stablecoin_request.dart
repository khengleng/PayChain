//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_stablecoin_request.g.dart';

/// CreateStablecoinRequest
///
/// Properties:
/// * [assetCode] 
/// * [assetName] 
/// * [classification] 
/// * [referenceCurrency] 
/// * [issuerLegalEntity] 
/// * [jurisdiction] 
/// * [reserveRatioTarget] 
@BuiltValue()
abstract class CreateStablecoinRequest implements Built<CreateStablecoinRequest, CreateStablecoinRequestBuilder> {
  @BuiltValueField(wireName: r'assetCode')
  String get assetCode;

  @BuiltValueField(wireName: r'assetName')
  String get assetName;

  @BuiltValueField(wireName: r'classification')
  CreateStablecoinRequestClassificationEnum get classification;
  // enum classificationEnum {  FIAT_BACKED_STABLECOIN,  TOKENIZED_DEPOSIT,  STABLE_VALUE_CREDIT,  };

  @BuiltValueField(wireName: r'referenceCurrency')
  CreateStablecoinRequestReferenceCurrencyEnum get referenceCurrency;
  // enum referenceCurrencyEnum {  USD,  KHR,  };

  @BuiltValueField(wireName: r'issuerLegalEntity')
  String? get issuerLegalEntity;

  @BuiltValueField(wireName: r'jurisdiction')
  String? get jurisdiction;

  @BuiltValueField(wireName: r'reserveRatioTarget')
  String? get reserveRatioTarget;

  CreateStablecoinRequest._();

  factory CreateStablecoinRequest([void updates(CreateStablecoinRequestBuilder b)]) = _$CreateStablecoinRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateStablecoinRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateStablecoinRequest> get serializer => _$CreateStablecoinRequestSerializer();
}

class _$CreateStablecoinRequestSerializer implements PrimitiveSerializer<CreateStablecoinRequest> {
  @override
  final Iterable<Type> types = const [CreateStablecoinRequest, _$CreateStablecoinRequest];

  @override
  final String wireName = r'CreateStablecoinRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateStablecoinRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assetCode';
    yield serializers.serialize(
      object.assetCode,
      specifiedType: const FullType(String),
    );
    yield r'assetName';
    yield serializers.serialize(
      object.assetName,
      specifiedType: const FullType(String),
    );
    yield r'classification';
    yield serializers.serialize(
      object.classification,
      specifiedType: const FullType(CreateStablecoinRequestClassificationEnum),
    );
    yield r'referenceCurrency';
    yield serializers.serialize(
      object.referenceCurrency,
      specifiedType: const FullType(CreateStablecoinRequestReferenceCurrencyEnum),
    );
    if (object.issuerLegalEntity != null) {
      yield r'issuerLegalEntity';
      yield serializers.serialize(
        object.issuerLegalEntity,
        specifiedType: const FullType(String),
      );
    }
    if (object.jurisdiction != null) {
      yield r'jurisdiction';
      yield serializers.serialize(
        object.jurisdiction,
        specifiedType: const FullType(String),
      );
    }
    if (object.reserveRatioTarget != null) {
      yield r'reserveRatioTarget';
      yield serializers.serialize(
        object.reserveRatioTarget,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateStablecoinRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateStablecoinRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assetCode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetCode = valueDes;
          break;
        case r'assetName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetName = valueDes;
          break;
        case r'classification':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateStablecoinRequestClassificationEnum),
          ) as CreateStablecoinRequestClassificationEnum;
          result.classification = valueDes;
          break;
        case r'referenceCurrency':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateStablecoinRequestReferenceCurrencyEnum),
          ) as CreateStablecoinRequestReferenceCurrencyEnum;
          result.referenceCurrency = valueDes;
          break;
        case r'issuerLegalEntity':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.issuerLegalEntity = valueDes;
          break;
        case r'jurisdiction':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.jurisdiction = valueDes;
          break;
        case r'reserveRatioTarget':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reserveRatioTarget = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateStablecoinRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateStablecoinRequestBuilder();
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

class CreateStablecoinRequestClassificationEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'FIAT_BACKED_STABLECOIN')
  static const CreateStablecoinRequestClassificationEnum FIAT_BACKED_STABLECOIN = _$createStablecoinRequestClassificationEnum_FIAT_BACKED_STABLECOIN;
  @BuiltValueEnumConst(wireName: r'TOKENIZED_DEPOSIT')
  static const CreateStablecoinRequestClassificationEnum TOKENIZED_DEPOSIT = _$createStablecoinRequestClassificationEnum_TOKENIZED_DEPOSIT;
  @BuiltValueEnumConst(wireName: r'STABLE_VALUE_CREDIT')
  static const CreateStablecoinRequestClassificationEnum STABLE_VALUE_CREDIT = _$createStablecoinRequestClassificationEnum_STABLE_VALUE_CREDIT;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const CreateStablecoinRequestClassificationEnum unknownDefaultOpenApi = _$createStablecoinRequestClassificationEnum_unknownDefaultOpenApi;

  static Serializer<CreateStablecoinRequestClassificationEnum> get serializer => _$createStablecoinRequestClassificationEnumSerializer;

  const CreateStablecoinRequestClassificationEnum._(String name): super(name);

  static BuiltSet<CreateStablecoinRequestClassificationEnum> get values => _$createStablecoinRequestClassificationEnumValues;
  static CreateStablecoinRequestClassificationEnum valueOf(String name) => _$createStablecoinRequestClassificationEnumValueOf(name);
}

class CreateStablecoinRequestReferenceCurrencyEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'USD')
  static const CreateStablecoinRequestReferenceCurrencyEnum USD = _$createStablecoinRequestReferenceCurrencyEnum_USD;
  @BuiltValueEnumConst(wireName: r'KHR')
  static const CreateStablecoinRequestReferenceCurrencyEnum KHR = _$createStablecoinRequestReferenceCurrencyEnum_KHR;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const CreateStablecoinRequestReferenceCurrencyEnum unknownDefaultOpenApi = _$createStablecoinRequestReferenceCurrencyEnum_unknownDefaultOpenApi;

  static Serializer<CreateStablecoinRequestReferenceCurrencyEnum> get serializer => _$createStablecoinRequestReferenceCurrencyEnumSerializer;

  const CreateStablecoinRequestReferenceCurrencyEnum._(String name): super(name);

  static BuiltSet<CreateStablecoinRequestReferenceCurrencyEnum> get values => _$createStablecoinRequestReferenceCurrencyEnumValues;
  static CreateStablecoinRequestReferenceCurrencyEnum valueOf(String name) => _$createStablecoinRequestReferenceCurrencyEnumValueOf(name);
}

