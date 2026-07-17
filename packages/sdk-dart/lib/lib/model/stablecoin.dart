//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'stablecoin.g.dart';

/// Stablecoin
///
/// Properties:
/// * [id] 
/// * [assetId] 
/// * [assetCode] 
/// * [classification] 
/// * [referenceCurrency] 
/// * [lifecycleState] 
/// * [activationStatus] 
/// * [reserveRatioTarget] 
/// * [jurisdiction] 
/// * [createdAt] 
@BuiltValue()
abstract class Stablecoin implements Built<Stablecoin, StablecoinBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'assetId')
  String get assetId;

  @BuiltValueField(wireName: r'assetCode')
  String get assetCode;

  @BuiltValueField(wireName: r'classification')
  String get classification;

  @BuiltValueField(wireName: r'referenceCurrency')
  StablecoinReferenceCurrencyEnum get referenceCurrency;
  // enum referenceCurrencyEnum {  USD,  KHR,  };

  @BuiltValueField(wireName: r'lifecycleState')
  String get lifecycleState;

  @BuiltValueField(wireName: r'activationStatus')
  String get activationStatus;

  @BuiltValueField(wireName: r'reserveRatioTarget')
  String get reserveRatioTarget;

  @BuiltValueField(wireName: r'jurisdiction')
  String? get jurisdiction;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  Stablecoin._();

  factory Stablecoin([void updates(StablecoinBuilder b)]) = _$Stablecoin;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StablecoinBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Stablecoin> get serializer => _$StablecoinSerializer();
}

class _$StablecoinSerializer implements PrimitiveSerializer<Stablecoin> {
  @override
  final Iterable<Type> types = const [Stablecoin, _$Stablecoin];

  @override
  final String wireName = r'Stablecoin';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Stablecoin object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'assetId';
    yield serializers.serialize(
      object.assetId,
      specifiedType: const FullType(String),
    );
    yield r'assetCode';
    yield serializers.serialize(
      object.assetCode,
      specifiedType: const FullType(String),
    );
    yield r'classification';
    yield serializers.serialize(
      object.classification,
      specifiedType: const FullType(String),
    );
    yield r'referenceCurrency';
    yield serializers.serialize(
      object.referenceCurrency,
      specifiedType: const FullType(StablecoinReferenceCurrencyEnum),
    );
    yield r'lifecycleState';
    yield serializers.serialize(
      object.lifecycleState,
      specifiedType: const FullType(String),
    );
    yield r'activationStatus';
    yield serializers.serialize(
      object.activationStatus,
      specifiedType: const FullType(String),
    );
    yield r'reserveRatioTarget';
    yield serializers.serialize(
      object.reserveRatioTarget,
      specifiedType: const FullType(String),
    );
    if (object.jurisdiction != null) {
      yield r'jurisdiction';
      yield serializers.serialize(
        object.jurisdiction,
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
    Stablecoin object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StablecoinBuilder result,
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
        case r'assetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetId = valueDes;
          break;
        case r'assetCode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetCode = valueDes;
          break;
        case r'classification':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.classification = valueDes;
          break;
        case r'referenceCurrency':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(StablecoinReferenceCurrencyEnum),
          ) as StablecoinReferenceCurrencyEnum;
          result.referenceCurrency = valueDes;
          break;
        case r'lifecycleState':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lifecycleState = valueDes;
          break;
        case r'activationStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.activationStatus = valueDes;
          break;
        case r'reserveRatioTarget':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reserveRatioTarget = valueDes;
          break;
        case r'jurisdiction':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.jurisdiction = valueDes;
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
  Stablecoin deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StablecoinBuilder();
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

class StablecoinReferenceCurrencyEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'USD')
  static const StablecoinReferenceCurrencyEnum USD = _$stablecoinReferenceCurrencyEnum_USD;
  @BuiltValueEnumConst(wireName: r'KHR')
  static const StablecoinReferenceCurrencyEnum KHR = _$stablecoinReferenceCurrencyEnum_KHR;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const StablecoinReferenceCurrencyEnum unknownDefaultOpenApi = _$stablecoinReferenceCurrencyEnum_unknownDefaultOpenApi;

  static Serializer<StablecoinReferenceCurrencyEnum> get serializer => _$stablecoinReferenceCurrencyEnumSerializer;

  const StablecoinReferenceCurrencyEnum._(String name): super(name);

  static BuiltSet<StablecoinReferenceCurrencyEnum> get values => _$stablecoinReferenceCurrencyEnumValues;
  static StablecoinReferenceCurrencyEnum valueOf(String name) => _$stablecoinReferenceCurrencyEnumValueOf(name);
}

