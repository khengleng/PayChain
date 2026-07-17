//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:paychain_sdk/lib/model/webhook_endpoint.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'webhook_endpoint_with_secret.g.dart';

/// WebhookEndpointWithSecret
///
/// Properties:
/// * [id] 
/// * [url] 
/// * [events] 
/// * [status] 
/// * [createdAt] 
/// * [secret] - Returned only at create/rotate time.
@BuiltValue()
abstract class WebhookEndpointWithSecret implements WebhookEndpoint, Built<WebhookEndpointWithSecret, WebhookEndpointWithSecretBuilder> {
  /// Returned only at create/rotate time.
  @BuiltValueField(wireName: r'secret')
  String get secret;

  WebhookEndpointWithSecret._();

  factory WebhookEndpointWithSecret([void updates(WebhookEndpointWithSecretBuilder b)]) = _$WebhookEndpointWithSecret;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(WebhookEndpointWithSecretBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<WebhookEndpointWithSecret> get serializer => _$WebhookEndpointWithSecretSerializer();
}

class _$WebhookEndpointWithSecretSerializer implements PrimitiveSerializer<WebhookEndpointWithSecret> {
  @override
  final Iterable<Type> types = const [WebhookEndpointWithSecret, _$WebhookEndpointWithSecret];

  @override
  final String wireName = r'WebhookEndpointWithSecret';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    WebhookEndpointWithSecret object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'secret';
    yield serializers.serialize(
      object.secret,
      specifiedType: const FullType(String),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
    yield r'events';
    yield serializers.serialize(
      object.events,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    WebhookEndpointWithSecret object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required WebhookEndpointWithSecretBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'secret':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.secret = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        case r'events':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.events.replace(valueDes);
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.status = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  WebhookEndpointWithSecret deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = WebhookEndpointWithSecretBuilder();
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

