//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_wallet_request.g.dart';

/// CreateWalletRequest
///
/// Properties:
/// * [ownerType] 
/// * [ownerReference] 
/// * [externalReference] 
@BuiltValue()
abstract class CreateWalletRequest implements Built<CreateWalletRequest, CreateWalletRequestBuilder> {
  @BuiltValueField(wireName: r'ownerType')
  CreateWalletRequestOwnerTypeEnum get ownerType;
  // enum ownerTypeEnum {  CUSTOMER,  MERCHANT,  ORGANIZATION,  TREASURY,  CAMPAIGN,  SYSTEM,  REDEMPTION,  SETTLEMENT,  };

  @BuiltValueField(wireName: r'ownerReference')
  String get ownerReference;

  @BuiltValueField(wireName: r'externalReference')
  String? get externalReference;

  CreateWalletRequest._();

  factory CreateWalletRequest([void updates(CreateWalletRequestBuilder b)]) = _$CreateWalletRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateWalletRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateWalletRequest> get serializer => _$CreateWalletRequestSerializer();
}

class _$CreateWalletRequestSerializer implements PrimitiveSerializer<CreateWalletRequest> {
  @override
  final Iterable<Type> types = const [CreateWalletRequest, _$CreateWalletRequest];

  @override
  final String wireName = r'CreateWalletRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateWalletRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ownerType';
    yield serializers.serialize(
      object.ownerType,
      specifiedType: const FullType(CreateWalletRequestOwnerTypeEnum),
    );
    yield r'ownerReference';
    yield serializers.serialize(
      object.ownerReference,
      specifiedType: const FullType(String),
    );
    if (object.externalReference != null) {
      yield r'externalReference';
      yield serializers.serialize(
        object.externalReference,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateWalletRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateWalletRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ownerType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateWalletRequestOwnerTypeEnum),
          ) as CreateWalletRequestOwnerTypeEnum;
          result.ownerType = valueDes;
          break;
        case r'ownerReference':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ownerReference = valueDes;
          break;
        case r'externalReference':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.externalReference = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateWalletRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateWalletRequestBuilder();
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

class CreateWalletRequestOwnerTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'CUSTOMER')
  static const CreateWalletRequestOwnerTypeEnum CUSTOMER = _$createWalletRequestOwnerTypeEnum_CUSTOMER;
  @BuiltValueEnumConst(wireName: r'MERCHANT')
  static const CreateWalletRequestOwnerTypeEnum MERCHANT = _$createWalletRequestOwnerTypeEnum_MERCHANT;
  @BuiltValueEnumConst(wireName: r'ORGANIZATION')
  static const CreateWalletRequestOwnerTypeEnum ORGANIZATION = _$createWalletRequestOwnerTypeEnum_ORGANIZATION;
  @BuiltValueEnumConst(wireName: r'TREASURY')
  static const CreateWalletRequestOwnerTypeEnum TREASURY = _$createWalletRequestOwnerTypeEnum_TREASURY;
  @BuiltValueEnumConst(wireName: r'CAMPAIGN')
  static const CreateWalletRequestOwnerTypeEnum CAMPAIGN = _$createWalletRequestOwnerTypeEnum_CAMPAIGN;
  @BuiltValueEnumConst(wireName: r'SYSTEM')
  static const CreateWalletRequestOwnerTypeEnum SYSTEM = _$createWalletRequestOwnerTypeEnum_SYSTEM;
  @BuiltValueEnumConst(wireName: r'REDEMPTION')
  static const CreateWalletRequestOwnerTypeEnum REDEMPTION = _$createWalletRequestOwnerTypeEnum_REDEMPTION;
  @BuiltValueEnumConst(wireName: r'SETTLEMENT')
  static const CreateWalletRequestOwnerTypeEnum SETTLEMENT = _$createWalletRequestOwnerTypeEnum_SETTLEMENT;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const CreateWalletRequestOwnerTypeEnum unknownDefaultOpenApi = _$createWalletRequestOwnerTypeEnum_unknownDefaultOpenApi;

  static Serializer<CreateWalletRequestOwnerTypeEnum> get serializer => _$createWalletRequestOwnerTypeEnumSerializer;

  const CreateWalletRequestOwnerTypeEnum._(String name): super(name);

  static BuiltSet<CreateWalletRequestOwnerTypeEnum> get values => _$createWalletRequestOwnerTypeEnumValues;
  static CreateWalletRequestOwnerTypeEnum valueOf(String name) => _$createWalletRequestOwnerTypeEnumValueOf(name);
}

