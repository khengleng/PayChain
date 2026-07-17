//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'webhook_create_request.g.dart';

/// WebhookCreateRequest
///
/// Properties:
/// * [url] 
/// * [events] 
@BuiltValue()
abstract class WebhookCreateRequest implements Built<WebhookCreateRequest, WebhookCreateRequestBuilder> {
  @BuiltValueField(wireName: r'url')
  String get url;

  @BuiltValueField(wireName: r'events')
  BuiltList<String> get events;

  WebhookCreateRequest._();

  factory WebhookCreateRequest([void updates(WebhookCreateRequestBuilder b)]) = _$WebhookCreateRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(WebhookCreateRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<WebhookCreateRequest> get serializer => _$WebhookCreateRequestSerializer();
}

class _$WebhookCreateRequestSerializer implements PrimitiveSerializer<WebhookCreateRequest> {
  @override
  final Iterable<Type> types = const [WebhookCreateRequest, _$WebhookCreateRequest];

  @override
  final String wireName = r'WebhookCreateRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    WebhookCreateRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
  }

  @override
  Object serialize(
    Serializers serializers,
    WebhookCreateRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required WebhookCreateRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  WebhookCreateRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = WebhookCreateRequestBuilder();
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

