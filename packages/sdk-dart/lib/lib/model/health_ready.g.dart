// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'health_ready.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const HealthReadyStatusEnum _$healthReadyStatusEnum_ok =
    const HealthReadyStatusEnum._('ok');
const HealthReadyStatusEnum _$healthReadyStatusEnum_degraded =
    const HealthReadyStatusEnum._('degraded');
const HealthReadyStatusEnum _$healthReadyStatusEnum_unknownDefaultOpenApi =
    const HealthReadyStatusEnum._('unknownDefaultOpenApi');

HealthReadyStatusEnum _$healthReadyStatusEnumValueOf(String name) {
  switch (name) {
    case 'ok':
      return _$healthReadyStatusEnum_ok;
    case 'degraded':
      return _$healthReadyStatusEnum_degraded;
    case 'unknownDefaultOpenApi':
      return _$healthReadyStatusEnum_unknownDefaultOpenApi;
    default:
      return _$healthReadyStatusEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<HealthReadyStatusEnum> _$healthReadyStatusEnumValues =
    BuiltSet<HealthReadyStatusEnum>(const <HealthReadyStatusEnum>[
  _$healthReadyStatusEnum_ok,
  _$healthReadyStatusEnum_degraded,
  _$healthReadyStatusEnum_unknownDefaultOpenApi,
]);

Serializer<HealthReadyStatusEnum> _$healthReadyStatusEnumSerializer =
    _$HealthReadyStatusEnumSerializer();

class _$HealthReadyStatusEnumSerializer
    implements PrimitiveSerializer<HealthReadyStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'ok': 'ok',
    'degraded': 'degraded',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'ok': 'ok',
    'degraded': 'degraded',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[HealthReadyStatusEnum];
  @override
  final String wireName = 'HealthReadyStatusEnum';

  @override
  Object serialize(Serializers serializers, HealthReadyStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  HealthReadyStatusEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      HealthReadyStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$HealthReady extends HealthReady {
  @override
  final HealthReadyStatusEnum status;
  @override
  final bool database;

  factory _$HealthReady([void Function(HealthReadyBuilder)? updates]) =>
      (HealthReadyBuilder()..update(updates))._build();

  _$HealthReady._({required this.status, required this.database}) : super._();
  @override
  HealthReady rebuild(void Function(HealthReadyBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  HealthReadyBuilder toBuilder() => HealthReadyBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is HealthReady &&
        status == other.status &&
        database == other.database;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, database.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'HealthReady')
          ..add('status', status)
          ..add('database', database))
        .toString();
  }
}

class HealthReadyBuilder implements Builder<HealthReady, HealthReadyBuilder> {
  _$HealthReady? _$v;

  HealthReadyStatusEnum? _status;
  HealthReadyStatusEnum? get status => _$this._status;
  set status(HealthReadyStatusEnum? status) => _$this._status = status;

  bool? _database;
  bool? get database => _$this._database;
  set database(bool? database) => _$this._database = database;

  HealthReadyBuilder() {
    HealthReady._defaults(this);
  }

  HealthReadyBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _database = $v.database;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(HealthReady other) {
    _$v = other as _$HealthReady;
  }

  @override
  void update(void Function(HealthReadyBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  HealthReady build() => _build();

  _$HealthReady _build() {
    final _$result = _$v ??
        _$HealthReady._(
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'HealthReady', 'status'),
          database: BuiltValueNullFieldError.checkNotNull(
              database, r'HealthReady', 'database'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
