// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approve_stablecoin_gate_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ApproveStablecoinGateRequestGateEnum
    _$approveStablecoinGateRequestGateEnum_LEGAL =
    const ApproveStablecoinGateRequestGateEnum._('LEGAL');
const ApproveStablecoinGateRequestGateEnum
    _$approveStablecoinGateRequestGateEnum_COMPLIANCE =
    const ApproveStablecoinGateRequestGateEnum._('COMPLIANCE');
const ApproveStablecoinGateRequestGateEnum
    _$approveStablecoinGateRequestGateEnum_TREASURY =
    const ApproveStablecoinGateRequestGateEnum._('TREASURY');
const ApproveStablecoinGateRequestGateEnum
    _$approveStablecoinGateRequestGateEnum_RESERVE =
    const ApproveStablecoinGateRequestGateEnum._('RESERVE');
const ApproveStablecoinGateRequestGateEnum
    _$approveStablecoinGateRequestGateEnum_TECHNICAL =
    const ApproveStablecoinGateRequestGateEnum._('TECHNICAL');
const ApproveStablecoinGateRequestGateEnum
    _$approveStablecoinGateRequestGateEnum_PILOT =
    const ApproveStablecoinGateRequestGateEnum._('PILOT');
const ApproveStablecoinGateRequestGateEnum
    _$approveStablecoinGateRequestGateEnum_unknownDefaultOpenApi =
    const ApproveStablecoinGateRequestGateEnum._('unknownDefaultOpenApi');

ApproveStablecoinGateRequestGateEnum
    _$approveStablecoinGateRequestGateEnumValueOf(String name) {
  switch (name) {
    case 'LEGAL':
      return _$approveStablecoinGateRequestGateEnum_LEGAL;
    case 'COMPLIANCE':
      return _$approveStablecoinGateRequestGateEnum_COMPLIANCE;
    case 'TREASURY':
      return _$approveStablecoinGateRequestGateEnum_TREASURY;
    case 'RESERVE':
      return _$approveStablecoinGateRequestGateEnum_RESERVE;
    case 'TECHNICAL':
      return _$approveStablecoinGateRequestGateEnum_TECHNICAL;
    case 'PILOT':
      return _$approveStablecoinGateRequestGateEnum_PILOT;
    case 'unknownDefaultOpenApi':
      return _$approveStablecoinGateRequestGateEnum_unknownDefaultOpenApi;
    default:
      return _$approveStablecoinGateRequestGateEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<ApproveStablecoinGateRequestGateEnum>
    _$approveStablecoinGateRequestGateEnumValues = BuiltSet<
        ApproveStablecoinGateRequestGateEnum>(const <ApproveStablecoinGateRequestGateEnum>[
  _$approveStablecoinGateRequestGateEnum_LEGAL,
  _$approveStablecoinGateRequestGateEnum_COMPLIANCE,
  _$approveStablecoinGateRequestGateEnum_TREASURY,
  _$approveStablecoinGateRequestGateEnum_RESERVE,
  _$approveStablecoinGateRequestGateEnum_TECHNICAL,
  _$approveStablecoinGateRequestGateEnum_PILOT,
  _$approveStablecoinGateRequestGateEnum_unknownDefaultOpenApi,
]);

Serializer<ApproveStablecoinGateRequestGateEnum>
    _$approveStablecoinGateRequestGateEnumSerializer =
    _$ApproveStablecoinGateRequestGateEnumSerializer();

class _$ApproveStablecoinGateRequestGateEnumSerializer
    implements PrimitiveSerializer<ApproveStablecoinGateRequestGateEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'LEGAL': 'LEGAL',
    'COMPLIANCE': 'COMPLIANCE',
    'TREASURY': 'TREASURY',
    'RESERVE': 'RESERVE',
    'TECHNICAL': 'TECHNICAL',
    'PILOT': 'PILOT',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'LEGAL': 'LEGAL',
    'COMPLIANCE': 'COMPLIANCE',
    'TREASURY': 'TREASURY',
    'RESERVE': 'RESERVE',
    'TECHNICAL': 'TECHNICAL',
    'PILOT': 'PILOT',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ApproveStablecoinGateRequestGateEnum
  ];
  @override
  final String wireName = 'ApproveStablecoinGateRequestGateEnum';

  @override
  Object serialize(
          Serializers serializers, ApproveStablecoinGateRequestGateEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ApproveStablecoinGateRequestGateEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ApproveStablecoinGateRequestGateEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ApproveStablecoinGateRequest extends ApproveStablecoinGateRequest {
  @override
  final ApproveStablecoinGateRequestGateEnum gate;
  @override
  final String? note;

  factory _$ApproveStablecoinGateRequest(
          [void Function(ApproveStablecoinGateRequestBuilder)? updates]) =>
      (ApproveStablecoinGateRequestBuilder()..update(updates))._build();

  _$ApproveStablecoinGateRequest._({required this.gate, this.note}) : super._();
  @override
  ApproveStablecoinGateRequest rebuild(
          void Function(ApproveStablecoinGateRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ApproveStablecoinGateRequestBuilder toBuilder() =>
      ApproveStablecoinGateRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApproveStablecoinGateRequest &&
        gate == other.gate &&
        note == other.note;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, gate.hashCode);
    _$hash = $jc(_$hash, note.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ApproveStablecoinGateRequest')
          ..add('gate', gate)
          ..add('note', note))
        .toString();
  }
}

class ApproveStablecoinGateRequestBuilder
    implements
        Builder<ApproveStablecoinGateRequest,
            ApproveStablecoinGateRequestBuilder> {
  _$ApproveStablecoinGateRequest? _$v;

  ApproveStablecoinGateRequestGateEnum? _gate;
  ApproveStablecoinGateRequestGateEnum? get gate => _$this._gate;
  set gate(ApproveStablecoinGateRequestGateEnum? gate) => _$this._gate = gate;

  String? _note;
  String? get note => _$this._note;
  set note(String? note) => _$this._note = note;

  ApproveStablecoinGateRequestBuilder() {
    ApproveStablecoinGateRequest._defaults(this);
  }

  ApproveStablecoinGateRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _gate = $v.gate;
      _note = $v.note;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ApproveStablecoinGateRequest other) {
    _$v = other as _$ApproveStablecoinGateRequest;
  }

  @override
  void update(void Function(ApproveStablecoinGateRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApproveStablecoinGateRequest build() => _build();

  _$ApproveStablecoinGateRequest _build() {
    final _$result = _$v ??
        _$ApproveStablecoinGateRequest._(
          gate: BuiltValueNullFieldError.checkNotNull(
              gate, r'ApproveStablecoinGateRequest', 'gate'),
          note: note,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
