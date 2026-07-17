//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'webhook_endpoint.g.dart';

/// WebhookEndpoint
///
/// Properties:
/// * [id] 
/// * [url] 
/// * [events] 
/// * [status] 
/// * [createdAt] 
@BuiltValue(instantiable: false)
abstract class WebhookEndpoint  {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'url')
  String get url;

  @BuiltValueField(wireName: r'events')
  BuiltList<String> get events;

  @BuiltValueField(wireName: r'status')
  String get status;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueSerializer(custom: true)
  static Serializer<WebhookEndpoint> get serializer => _$WebhookEndpointSerializer();
}

class _$WebhookEndpointSerializer implements PrimitiveSerializer<WebhookEndpoint> {
  @override
  final Iterable<Type> types = const [WebhookEndpoint];

  @override
  final String wireName = r'WebhookEndpoint';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    WebhookEndpoint object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    WebhookEndpoint object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  @override
  WebhookEndpoint deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.deserialize(serialized, specifiedType: FullType($WebhookEndpoint)) as $WebhookEndpoint;
  }
}

/// a concrete implementation of [WebhookEndpoint], since [WebhookEndpoint] is not instantiable
@BuiltValue(instantiable: true)
abstract class $WebhookEndpoint implements WebhookEndpoint, Built<$WebhookEndpoint, $WebhookEndpointBuilder> {
  $WebhookEndpoint._();

  factory $WebhookEndpoint([void Function($WebhookEndpointBuilder)? updates]) = _$$WebhookEndpoint;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults($WebhookEndpointBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<$WebhookEndpoint> get serializer => _$$WebhookEndpointSerializer();
}

class _$$WebhookEndpointSerializer implements PrimitiveSerializer<$WebhookEndpoint> {
  @override
  final Iterable<Type> types = const [$WebhookEndpoint, _$$WebhookEndpoint];

  @override
  final String wireName = r'$WebhookEndpoint';

  @override
  Object serialize(
    Serializers serializers,
    $WebhookEndpoint object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.serialize(object, specifiedType: FullType(WebhookEndpoint))!;
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required WebhookEndpointBuilder result,
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
  $WebhookEndpoint deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = $WebhookEndpointBuilder();
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

