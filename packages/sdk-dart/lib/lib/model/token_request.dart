//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'token_request.g.dart';

/// TokenRequest
///
/// Properties:
/// * [grantType] 
/// * [clientId] 
/// * [clientSecret] 
@BuiltValue()
abstract class TokenRequest implements Built<TokenRequest, TokenRequestBuilder> {
  @BuiltValueField(wireName: r'grant_type')
  TokenRequestGrantTypeEnum get grantType;
  // enum grantTypeEnum {  client_credentials,  };

  @BuiltValueField(wireName: r'client_id')
  String get clientId;

  @BuiltValueField(wireName: r'client_secret')
  String get clientSecret;

  TokenRequest._();

  factory TokenRequest([void updates(TokenRequestBuilder b)]) = _$TokenRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TokenRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TokenRequest> get serializer => _$TokenRequestSerializer();
}

class _$TokenRequestSerializer implements PrimitiveSerializer<TokenRequest> {
  @override
  final Iterable<Type> types = const [TokenRequest, _$TokenRequest];

  @override
  final String wireName = r'TokenRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TokenRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'grant_type';
    yield serializers.serialize(
      object.grantType,
      specifiedType: const FullType(TokenRequestGrantTypeEnum),
    );
    yield r'client_id';
    yield serializers.serialize(
      object.clientId,
      specifiedType: const FullType(String),
    );
    yield r'client_secret';
    yield serializers.serialize(
      object.clientSecret,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TokenRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TokenRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'grant_type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(TokenRequestGrantTypeEnum),
          ) as TokenRequestGrantTypeEnum;
          result.grantType = valueDes;
          break;
        case r'client_id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientId = valueDes;
          break;
        case r'client_secret':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientSecret = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TokenRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TokenRequestBuilder();
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

class TokenRequestGrantTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'client_credentials')
  static const TokenRequestGrantTypeEnum clientCredentials = _$tokenRequestGrantTypeEnum_clientCredentials;
  @BuiltValueEnumConst(wireName: r'unknown_default_open_api', fallback: true)
  static const TokenRequestGrantTypeEnum unknownDefaultOpenApi = _$tokenRequestGrantTypeEnum_unknownDefaultOpenApi;

  static Serializer<TokenRequestGrantTypeEnum> get serializer => _$tokenRequestGrantTypeEnumSerializer;

  const TokenRequestGrantTypeEnum._(String name): super(name);

  static BuiltSet<TokenRequestGrantTypeEnum> get values => _$tokenRequestGrantTypeEnumValues;
  static TokenRequestGrantTypeEnum valueOf(String name) => _$tokenRequestGrantTypeEnumValueOf(name);
}

