//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'issue_request.g.dart';

/// IssueRequest
///
/// Properties:
/// * [destinationWalletId] 
/// * [amount] 
@BuiltValue()
abstract class IssueRequest implements Built<IssueRequest, IssueRequestBuilder> {
  @BuiltValueField(wireName: r'destinationWalletId')
  String get destinationWalletId;

  @BuiltValueField(wireName: r'amount')
  String get amount;

  IssueRequest._();

  factory IssueRequest([void updates(IssueRequestBuilder b)]) = _$IssueRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(IssueRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<IssueRequest> get serializer => _$IssueRequestSerializer();
}

class _$IssueRequestSerializer implements PrimitiveSerializer<IssueRequest> {
  @override
  final Iterable<Type> types = const [IssueRequest, _$IssueRequest];

  @override
  final String wireName = r'IssueRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    IssueRequest object, {
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
  }

  @override
  Object serialize(
    Serializers serializers,
    IssueRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required IssueRequestBuilder result,
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  IssueRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = IssueRequestBuilder();
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

