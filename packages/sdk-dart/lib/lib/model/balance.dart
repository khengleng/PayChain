//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'balance.g.dart';

/// Balance
///
/// Properties:
/// * [assetCode] 
/// * [issuerPublicKey] - Empty string for native/no-issuer assets.
/// * [balance] 
/// * [updatedAt] 
@BuiltValue()
abstract class Balance implements Built<Balance, BalanceBuilder> {
  @BuiltValueField(wireName: r'assetCode')
  String get assetCode;

  /// Empty string for native/no-issuer assets.
  @BuiltValueField(wireName: r'issuerPublicKey')
  String get issuerPublicKey;

  @BuiltValueField(wireName: r'balance')
  String get balance;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  Balance._();

  factory Balance([void updates(BalanceBuilder b)]) = _$Balance;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BalanceBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Balance> get serializer => _$BalanceSerializer();
}

class _$BalanceSerializer implements PrimitiveSerializer<Balance> {
  @override
  final Iterable<Type> types = const [Balance, _$Balance];

  @override
  final String wireName = r'Balance';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Balance object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assetCode';
    yield serializers.serialize(
      object.assetCode,
      specifiedType: const FullType(String),
    );
    yield r'issuerPublicKey';
    yield serializers.serialize(
      object.issuerPublicKey,
      specifiedType: const FullType(String),
    );
    yield r'balance';
    yield serializers.serialize(
      object.balance,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    Balance object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BalanceBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assetCode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetCode = valueDes;
          break;
        case r'issuerPublicKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.issuerPublicKey = valueDes;
          break;
        case r'balance':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.balance = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  Balance deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BalanceBuilder();
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

