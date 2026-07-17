// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'error_response_message.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ErrorResponseMessage extends ErrorResponseMessage {
  @override
  final OneOf oneOf;

  factory _$ErrorResponseMessage(
          [void Function(ErrorResponseMessageBuilder)? updates]) =>
      (ErrorResponseMessageBuilder()..update(updates))._build();

  _$ErrorResponseMessage._({required this.oneOf}) : super._();
  @override
  ErrorResponseMessage rebuild(
          void Function(ErrorResponseMessageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ErrorResponseMessageBuilder toBuilder() =>
      ErrorResponseMessageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ErrorResponseMessage && oneOf == other.oneOf;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, oneOf.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ErrorResponseMessage')
          ..add('oneOf', oneOf))
        .toString();
  }
}

class ErrorResponseMessageBuilder
    implements Builder<ErrorResponseMessage, ErrorResponseMessageBuilder> {
  _$ErrorResponseMessage? _$v;

  OneOf? _oneOf;
  OneOf? get oneOf => _$this._oneOf;
  set oneOf(OneOf? oneOf) => _$this._oneOf = oneOf;

  ErrorResponseMessageBuilder() {
    ErrorResponseMessage._defaults(this);
  }

  ErrorResponseMessageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _oneOf = $v.oneOf;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ErrorResponseMessage other) {
    _$v = other as _$ErrorResponseMessage;
  }

  @override
  void update(void Function(ErrorResponseMessageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ErrorResponseMessage build() => _build();

  _$ErrorResponseMessage _build() {
    final _$result = _$v ??
        _$ErrorResponseMessage._(
          oneOf: BuiltValueNullFieldError.checkNotNull(
              oneOf, r'ErrorResponseMessage', 'oneOf'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
