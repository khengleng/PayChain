//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transfer_request.g.dart';

/// TransferRequest
///
/// Properties:
/// * [sourceWalletId] 
/// * [destinationWalletId] 
/// * [amount] 
@BuiltValue()
abstract class TransferRequest implements Built<TransferRequest, TransferRequestBuilder> {
  @BuiltValueField(wireName: r'sourceWalletId')
  String get sourceWalletId;

  @BuiltValueField(wireName: r'destinationWalletId')
  String get destinationWalletId;

  @BuiltValueField(wireName: r'amount')
  String get amount;

  TransferRequest._();

  factory TransferRequest([void updates(TransferRequestBuilder b)]) = _$TransferRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TransferRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TransferRequest> get serializer => _$TransferRequestSerializer();
}

class _$TransferRequestSerializer implements PrimitiveSerializer<TransferRequest> {
  @override
  final Iterable<Type> types = const [TransferRequest, _$TransferRequest];

  @override
  final String wireName = r'TransferRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TransferRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'sourceWalletId';
    yield serializers.serialize(
      object.sourceWalletId,
      specifiedType: const FullType(String),
    );
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
  }

  @override
  Object serialize(
    Serializers serializers,
    TransferRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TransferRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'sourceWalletId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.sourceWalletId = valueDes;
          break;
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TransferRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TransferRequestBuilder();
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

