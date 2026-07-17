//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'wallet.g.dart';

/// Wallet
///
/// Properties:
/// * [id] 
/// * [ownerType] 
/// * [ownerReference] 
/// * [stellarAccountId] 
/// * [status] 
/// * [createdAt] 
@BuiltValue()
abstract class Wallet implements Built<Wallet, WalletBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'ownerType')
  WalletOwnerTypeEnum get ownerType;
  // enum ownerTypeEnum {  CUSTOMER,  MERCHANT,  ORGANIZATION,  TREASURY,  CAMPAIGN,  SYSTEM,  REDEMPTION,  SETTLEMENT,  };

  @BuiltValueField(wireName: r'ownerReference')
  String get ownerReference;

  @BuiltValueField(wireName: r'stellarAccountId')
  String get stellarAccountId;

  @BuiltValueField(wireName: r'status')
  String get status;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  Wallet._();

  factory Wallet([void updates(WalletBuilder b)]) = _$Wallet;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(WalletBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Wallet> get serializer => _$WalletSerializer();
}

class _$WalletSerializer implements PrimitiveSerializer<Wallet> {
  @override
  final Iterable<Type> types = const [Wallet, _$Wallet];

  @override
  final String wireName = r'Wallet';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Wallet object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'ownerType';
    yield serializers.serialize(
      object.ownerType,
      specifiedType: const FullType(WalletOwnerTypeEnum),
    );
    yield r'ownerReference';
    yield serializers.serialize(
      object.ownerReference,
      specifiedType: const FullType(String),
    );
    yield r'stellarAccountId';
    yield serializers.serialize(
      object.stellarAccountId,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    Wallet object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required WalletBuilder result,
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
        case r'ownerType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(WalletOwnerTypeEnum),
          ) as WalletOwnerTypeEnum;
          result.ownerType = valueDes;
          break;
        case r'ownerReference':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ownerReference = valueDes;
          break;
        case r'stellarAccountId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.stellarAccountId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.status = valueDes;
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
  Wallet deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = WalletBuilder();
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

class WalletOwnerTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'CUSTOMER')
  static const WalletOwnerTypeEnum CUSTOMER = _$walletOwnerTypeEnum_CUSTOMER;
  @BuiltValueEnumConst(wireName: r'MERCHANT')
  static const WalletOwnerTypeEnum MERCHANT = _$walletOwnerTypeEnum_MERCHANT;
  @BuiltValueEnumConst(wireName: r'ORGANIZATION')
  static const WalletOwnerTypeEnum ORGANIZATION = _$walletOwnerTypeEnum_ORGANIZATION;
  @BuiltValueEnumConst(wireName: r'TREASURY')
  static const WalletOwnerTypeEnum TREASURY = _$walletOwnerTypeEnum_TREASURY;
  @BuiltValueEnumConst(wireName: r'CAMPAIGN')
  static const WalletOwnerTypeEnum CAMPAIGN = _$walletOwnerTypeEnum_CAMPAIGN;
  @BuiltValueEnumConst(wireName: r'SYSTEM')
  static const WalletOwnerTypeEnum SYSTEM = _$walletOwnerTypeEnum_SYSTEM;
  @BuiltValueEnumConst(wireName: r'REDEMPTION')
  static const WalletOwnerTypeEnum REDEMPTION = _$walletOwnerTypeEnum_REDEMPTION;
  @BuiltValueEnumConst(wireName: r'SETTLEMENT')
  static const WalletOwnerTypeEnum SETTLEMENT = _$walletOwnerTypeEnum_SETTLEMENT;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const WalletOwnerTypeEnum unknownDefaultOpenApi = _$walletOwnerTypeEnum_unknownDefaultOpenApi;

  static Serializer<WalletOwnerTypeEnum> get serializer => _$walletOwnerTypeEnumSerializer;

  const WalletOwnerTypeEnum._(String name): super(name);

  static BuiltSet<WalletOwnerTypeEnum> get values => _$walletOwnerTypeEnumValues;
  static WalletOwnerTypeEnum valueOf(String name) => _$walletOwnerTypeEnumValueOf(name);
}

