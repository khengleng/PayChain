//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'dart:core';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';
import 'package:one_of/one_of.dart';

part 'error_response_message.g.dart';

/// ErrorResponseMessage
@BuiltValue()
abstract class ErrorResponseMessage implements Built<ErrorResponseMessage, ErrorResponseMessageBuilder> {
  /// One Of [BuiltList<String>], [String]
  OneOf get oneOf;

  ErrorResponseMessage._();

  factory ErrorResponseMessage([void updates(ErrorResponseMessageBuilder b)]) = _$ErrorResponseMessage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ErrorResponseMessageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ErrorResponseMessage> get serializer => _$ErrorResponseMessageSerializer();
}

class _$ErrorResponseMessageSerializer implements PrimitiveSerializer<ErrorResponseMessage> {
  @override
  final Iterable<Type> types = const [ErrorResponseMessage, _$ErrorResponseMessage];

  @override
  final String wireName = r'ErrorResponseMessage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ErrorResponseMessage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
  }

  @override
  Object serialize(
    Serializers serializers,
    ErrorResponseMessage object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final oneOf = object.oneOf;
    return serializers.serialize(oneOf.value, specifiedType: FullType(oneOf.valueType))!;
  }

  @override
  ErrorResponseMessage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ErrorResponseMessageBuilder();
    Object? oneOfDataSrc;
    final targetType = const FullType(OneOf, [FullType(String), FullType(BuiltList, [FullType(String)]), ]);
    oneOfDataSrc = serialized;
    result.oneOf = serializers.deserialize(oneOfDataSrc, specifiedType: targetType) as OneOf;
    return result.build();
  }
}

