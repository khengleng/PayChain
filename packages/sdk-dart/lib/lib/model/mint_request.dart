//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mint_request.g.dart';

/// MintRequest
///
/// Properties:
/// * [destinationWalletId] 
/// * [amount] 
/// * [fundingReference] 
@BuiltValue()
abstract class MintRequest implements Built<MintRequest, MintRequestBuilder> {
  @BuiltValueField(wireName: r'destinationWalletId')
  String get destinationWalletId;

  @BuiltValueField(wireName: r'amount')
  String get amount;

  @BuiltValueField(wireName: r'fundingReference')
  String? get fundingReference;

  MintRequest._();

  factory MintRequest([void updates(MintRequestBuilder b)]) = _$MintRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MintRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MintRequest> get serializer => _$MintRequestSerializer();
}

class _$MintRequestSerializer implements PrimitiveSerializer<MintRequest> {
  @override
  final Iterable<Type> types = const [MintRequest, _$MintRequest];

  @override
  final String wireName = r'MintRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MintRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'destinationWalletId';
    yield serializers.serialize(
      object.destinationWalletId,
      specifiedType: const FullType(String),
    );
    yield r'amount';
    yield serializers.serialize(
      object.amount,
      specifiedType: const FullType(String),
    );
    if (object.fundingReference != null) {
      yield r'fundingReference';
      yield serializers.serialize(
        object.fundingReference,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    MintRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MintRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'destinationWalletId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.destinationWalletId = valueDes;
          break;
        case r'amount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.amount = valueDes;
          break;
        case r'fundingReference':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fundingReference = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MintRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MintRequestBuilder();
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

