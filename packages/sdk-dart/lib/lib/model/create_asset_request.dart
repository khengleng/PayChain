//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_asset_request.g.dart';

/// CreateAssetRequest
///
/// Properties:
/// * [assetCode] 
/// * [assetName] 
/// * [assetType] 
/// * [expiryPolicy] 
/// * [expiryDays] 
@BuiltValue()
abstract class CreateAssetRequest implements Built<CreateAssetRequest, CreateAssetRequestBuilder> {
  @BuiltValueField(wireName: r'assetCode')
  String get assetCode;

  @BuiltValueField(wireName: r'assetName')
  String get assetName;

  @BuiltValueField(wireName: r'assetType')
  CreateAssetRequestAssetTypeEnum? get assetType;
  // enum assetTypeEnum {  LOYALTY_POINT,  };

  @BuiltValueField(wireName: r'expiryPolicy')
  CreateAssetRequestExpiryPolicyEnum? get expiryPolicy;
  // enum expiryPolicyEnum {  NONE,  FIXED,  ROLLING,  };

  @BuiltValueField(wireName: r'expiryDays')
  int? get expiryDays;

  CreateAssetRequest._();

  factory CreateAssetRequest([void updates(CreateAssetRequestBuilder b)]) = _$CreateAssetRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateAssetRequestBuilder b) => b
      ..assetType = CreateAssetRequestAssetTypeEnum.valueOf('LOYALTY_POINT')
      ..expiryPolicy = CreateAssetRequestExpiryPolicyEnum.valueOf('NONE');

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateAssetRequest> get serializer => _$CreateAssetRequestSerializer();
}

class _$CreateAssetRequestSerializer implements PrimitiveSerializer<CreateAssetRequest> {
  @override
  final Iterable<Type> types = const [CreateAssetRequest, _$CreateAssetRequest];

  @override
  final String wireName = r'CreateAssetRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateAssetRequest object, {
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
    if (object.assetType != null) {
      yield r'assetType';
      yield serializers.serialize(
        object.assetType,
        specifiedType: const FullType(CreateAssetRequestAssetTypeEnum),
      );
    }
    if (object.expiryPolicy != null) {
      yield r'expiryPolicy';
      yield serializers.serialize(
        object.expiryPolicy,
        specifiedType: const FullType(CreateAssetRequestExpiryPolicyEnum),
      );
    }
    if (object.expiryDays != null) {
      yield r'expiryDays';
      yield serializers.serialize(
        object.expiryDays,
        specifiedType: const FullType(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateAssetRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateAssetRequestBuilder result,
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
        case r'assetType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateAssetRequestAssetTypeEnum),
          ) as CreateAssetRequestAssetTypeEnum;
          result.assetType = valueDes;
          break;
        case r'expiryPolicy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateAssetRequestExpiryPolicyEnum),
          ) as CreateAssetRequestExpiryPolicyEnum;
          result.expiryPolicy = valueDes;
          break;
        case r'expiryDays':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.expiryDays = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateAssetRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateAssetRequestBuilder();
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

class CreateAssetRequestAssetTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'LOYALTY_POINT')
  static const CreateAssetRequestAssetTypeEnum LOYALTY_POINT = _$createAssetRequestAssetTypeEnum_LOYALTY_POINT;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const CreateAssetRequestAssetTypeEnum unknownDefaultOpenApi = _$createAssetRequestAssetTypeEnum_unknownDefaultOpenApi;

  static Serializer<CreateAssetRequestAssetTypeEnum> get serializer => _$createAssetRequestAssetTypeEnumSerializer;

  const CreateAssetRequestAssetTypeEnum._(String name): super(name);

  static BuiltSet<CreateAssetRequestAssetTypeEnum> get values => _$createAssetRequestAssetTypeEnumValues;
  static CreateAssetRequestAssetTypeEnum valueOf(String name) => _$createAssetRequestAssetTypeEnumValueOf(name);
}

class CreateAssetRequestExpiryPolicyEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'NONE')
  static const CreateAssetRequestExpiryPolicyEnum NONE = _$createAssetRequestExpiryPolicyEnum_NONE;
  @BuiltValueEnumConst(wireName: r'FIXED')
  static const CreateAssetRequestExpiryPolicyEnum FIXED = _$createAssetRequestExpiryPolicyEnum_FIXED;
  @BuiltValueEnumConst(wireName: r'ROLLING')
  static const CreateAssetRequestExpiryPolicyEnum ROLLING = _$createAssetRequestExpiryPolicyEnum_ROLLING;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const CreateAssetRequestExpiryPolicyEnum unknownDefaultOpenApi = _$createAssetRequestExpiryPolicyEnum_unknownDefaultOpenApi;

  static Serializer<CreateAssetRequestExpiryPolicyEnum> get serializer => _$createAssetRequestExpiryPolicyEnumSerializer;

  const CreateAssetRequestExpiryPolicyEnum._(String name): super(name);

  static BuiltSet<CreateAssetRequestExpiryPolicyEnum> get values => _$createAssetRequestExpiryPolicyEnumValues;
  static CreateAssetRequestExpiryPolicyEnum valueOf(String name) => _$createAssetRequestExpiryPolicyEnumValueOf(name);
}

