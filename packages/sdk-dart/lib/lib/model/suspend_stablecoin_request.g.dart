// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'suspend_stablecoin_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SuspendStablecoinRequestModeEnum
    _$suspendStablecoinRequestModeEnum_MINTING_SUSPENDED =
    const SuspendStablecoinRequestModeEnum._('MINTING_SUSPENDED');
const SuspendStablecoinRequestModeEnum
    _$suspendStablecoinRequestModeEnum_REDEMPTION_SUSPENDED =
    const SuspendStablecoinRequestModeEnum._('REDEMPTION_SUSPENDED');
const SuspendStablecoinRequestModeEnum
    _$suspendStablecoinRequestModeEnum_FULLY_SUSPENDED =
    const SuspendStablecoinRequestModeEnum._('FULLY_SUSPENDED');
const SuspendStablecoinRequestModeEnum
    _$suspendStablecoinRequestModeEnum_unknownDefaultOpenApi =
    const SuspendStablecoinRequestModeEnum._('unknownDefaultOpenApi');

SuspendStablecoinRequestModeEnum _$suspendStablecoinRequestModeEnumValueOf(
    String name) {
  switch (name) {
    case 'MINTING_SUSPENDED':
      return _$suspendStablecoinRequestModeEnum_MINTING_SUSPENDED;
    case 'REDEMPTION_SUSPENDED':
      return _$suspendStablecoinRequestModeEnum_REDEMPTION_SUSPENDED;
    case 'FULLY_SUSPENDED':
      return _$suspendStablecoinRequestModeEnum_FULLY_SUSPENDED;
    case 'unknownDefaultOpenApi':
      return _$suspendStablecoinRequestModeEnum_unknownDefaultOpenApi;
    default:
      return _$suspendStablecoinRequestModeEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<SuspendStablecoinRequestModeEnum>
    _$suspendStablecoinRequestModeEnumValues = BuiltSet<
        SuspendStablecoinRequestModeEnum>(const <SuspendStablecoinRequestModeEnum>[
  _$suspendStablecoinRequestModeEnum_MINTING_SUSPENDED,
  _$suspendStablecoinRequestModeEnum_REDEMPTION_SUSPENDED,
  _$suspendStablecoinRequestModeEnum_FULLY_SUSPENDED,
  _$suspendStablecoinRequestModeEnum_unknownDefaultOpenApi,
]);

Serializer<SuspendStablecoinRequestModeEnum>
    _$suspendStablecoinRequestModeEnumSerializer =
    _$SuspendStablecoinRequestModeEnumSerializer();

class _$SuspendStablecoinRequestModeEnumSerializer
    implements PrimitiveSerializer<SuspendStablecoinRequestModeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'MINTING_SUSPENDED': 'MINTING_SUSPENDED',
    'REDEMPTION_SUSPENDED': 'REDEMPTION_SUSPENDED',
    'FULLY_SUSPENDED': 'FULLY_SUSPENDED',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'MINTING_SUSPENDED': 'MINTING_SUSPENDED',
    'REDEMPTION_SUSPENDED': 'REDEMPTION_SUSPENDED',
    'FULLY_SUSPENDED': 'FULLY_SUSPENDED',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[SuspendStablecoinRequestModeEnum];
  @override
  final String wireName = 'SuspendStablecoinRequestModeEnum';

  @override
  Object serialize(
          Serializers serializers, SuspendStablecoinRequestModeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SuspendStablecoinRequestModeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SuspendStablecoinRequestModeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SuspendStablecoinRequest extends SuspendStablecoinRequest {
  @override
  final SuspendStablecoinRequestModeEnum mode;

  factory _$SuspendStablecoinRequest(
          [void Function(SuspendStablecoinRequestBuilder)? updates]) =>
      (SuspendStablecoinRequestBuilder()..update(updates))._build();

  _$SuspendStablecoinRequest._({required this.mode}) : super._();
  @override
  SuspendStablecoinRequest rebuild(
          void Function(SuspendStablecoinRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SuspendStablecoinRequestBuilder toBuilder() =>
      SuspendStablecoinRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SuspendStablecoinRequest && mode == other.mode;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, mode.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SuspendStablecoinRequest')
          ..add('mode', mode))
        .toString();
  }
}

class SuspendStablecoinRequestBuilder
    implements
        Builder<SuspendStablecoinRequest, SuspendStablecoinRequestBuilder> {
  _$SuspendStablecoinRequest? _$v;

  SuspendStablecoinRequestModeEnum? _mode;
  SuspendStablecoinRequestModeEnum? get mode => _$this._mode;
  set mode(SuspendStablecoinRequestModeEnum? mode) => _$this._mode = mode;

  SuspendStablecoinRequestBuilder() {
    SuspendStablecoinRequest._defaults(this);
  }

  SuspendStablecoinRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _mode = $v.mode;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SuspendStablecoinRequest other) {
    _$v = other as _$SuspendStablecoinRequest;
  }

  @override
  void update(void Function(SuspendStablecoinRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SuspendStablecoinRequest build() => _build();

  _$SuspendStablecoinRequest _build() {
    final _$result = _$v ??
        _$SuspendStablecoinRequest._(
          mode: BuiltValueNullFieldError.checkNotNull(
              mode, r'SuspendStablecoinRequest', 'mode'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
