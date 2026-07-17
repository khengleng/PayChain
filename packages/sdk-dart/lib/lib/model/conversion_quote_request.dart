//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'conversion_quote_request.g.dart';

/// ConversionQuoteRequest
///
/// Properties:
/// * [fromAssetId] 
/// * [toAssetId] 
/// * [walletId] 
/// * [pointsAmount] 
/// * [rate] 
/// * [spread] 
/// * [fee] 
@BuiltValue()
abstract class ConversionQuoteRequest implements Built<ConversionQuoteRequest, ConversionQuoteRequestBuilder> {
  @BuiltValueField(wireName: r'fromAssetId')
  String get fromAssetId;

  @BuiltValueField(wireName: r'toAssetId')
  String get toAssetId;

  @BuiltValueField(wireName: r'walletId')
  String get walletId;

  @BuiltValueField(wireName: r'pointsAmount')
  String get pointsAmount;

  @BuiltValueField(wireName: r'rate')
  String? get rate;

  @BuiltValueField(wireName: r'spread')
  String? get spread;

  @BuiltValueField(wireName: r'fee')
  String? get fee;

  ConversionQuoteRequest._();

  factory ConversionQuoteRequest([void updates(ConversionQuoteRequestBuilder b)]) = _$ConversionQuoteRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ConversionQuoteRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ConversionQuoteRequest> get serializer => _$ConversionQuoteRequestSerializer();
}

class _$ConversionQuoteRequestSerializer implements PrimitiveSerializer<ConversionQuoteRequest> {
  @override
  final Iterable<Type> types = const [ConversionQuoteRequest, _$ConversionQuoteRequest];

  @override
  final String wireName = r'ConversionQuoteRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ConversionQuoteRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fromAssetId';
    yield serializers.serialize(
      object.fromAssetId,
      specifiedType: const FullType(String),
    );
    yield r'toAssetId';
    yield serializers.serialize(
      object.toAssetId,
      specifiedType: const FullType(String),
    );
    yield r'walletId';
    yield serializers.serialize(
      object.walletId,
      specifiedType: const FullType(String),
    );
    yield r'pointsAmount';
    yield serializers.serialize(
      object.pointsAmount,
      specifiedType: const FullType(String),
    );
    if (object.rate != null) {
      yield r'rate';
      yield serializers.serialize(
        object.rate,
        specifiedType: const FullType(String),
      );
    }
    if (object.spread != null) {
      yield r'spread';
      yield serializers.serialize(
        object.spread,
        specifiedType: const FullType(String),
      );
    }
    if (object.fee != null) {
      yield r'fee';
      yield serializers.serialize(
        object.fee,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ConversionQuoteRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ConversionQuoteRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fromAssetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fromAssetId = valueDes;
          break;
        case r'toAssetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.toAssetId = valueDes;
          break;
        case r'walletId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.walletId = valueDes;
          break;
        case r'pointsAmount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.pointsAmount = valueDes;
          break;
        case r'rate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.rate = valueDes;
          break;
        case r'spread':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.spread = valueDes;
          break;
        case r'fee':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fee = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ConversionQuoteRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ConversionQuoteRequestBuilder();
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

