// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'token_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const TokenRequestGrantTypeEnum _$tokenRequestGrantTypeEnum_clientCredentials =
    const TokenRequestGrantTypeEnum._('clientCredentials');
const TokenRequestGrantTypeEnum
    _$tokenRequestGrantTypeEnum_unknownDefaultOpenApi =
    const TokenRequestGrantTypeEnum._('unknownDefaultOpenApi');

TokenRequestGrantTypeEnum _$tokenRequestGrantTypeEnumValueOf(String name) {
  switch (name) {
    case 'clientCredentials':
      return _$tokenRequestGrantTypeEnum_clientCredentials;
    case 'unknownDefaultOpenApi':
      return _$tokenRequestGrantTypeEnum_unknownDefaultOpenApi;
    default:
      return _$tokenRequestGrantTypeEnum_unknownDefaultOpenApi;
  }
}

final BuiltSet<TokenRequestGrantTypeEnum> _$tokenRequestGrantTypeEnumValues =
    BuiltSet<TokenRequestGrantTypeEnum>(const <TokenRequestGrantTypeEnum>[
  _$tokenRequestGrantTypeEnum_clientCredentials,
  _$tokenRequestGrantTypeEnum_unknownDefaultOpenApi,
]);

Serializer<TokenRequestGrantTypeEnum> _$tokenRequestGrantTypeEnumSerializer =
    _$TokenRequestGrantTypeEnumSerializer();

class _$TokenRequestGrantTypeEnumSerializer
    implements PrimitiveSerializer<TokenRequestGrantTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'clientCredentials': 'client_credentials',
    'unknownDefaultOpenApi': 'unknown_default_open_api',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'client_credentials': 'clientCredentials',
    'unknown_default_open_api': 'unknownDefaultOpenApi',
  };

  @override
  final Iterable<Type> types = const <Type>[TokenRequestGrantTypeEnum];
  @override
  final String wireName = 'TokenRequestGrantTypeEnum';

  @override
  Object serialize(Serializers serializers, TokenRequestGrantTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  TokenRequestGrantTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      TokenRequestGrantTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$TokenRequest extends TokenRequest {
  @override
  final TokenRequestGrantTypeEnum grantType;
  @override
  final String clientId;
  @override
  final String clientSecret;

  factory _$TokenRequest([void Function(TokenRequestBuilder)? updates]) =>
      (TokenRequestBuilder()..update(updates))._build();

  _$TokenRequest._(
      {required this.grantType,
      required this.clientId,
      required this.clientSecret})
      : super._();
  @override
  TokenRequest rebuild(void Function(TokenRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TokenRequestBuilder toBuilder() => TokenRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TokenRequest &&
        grantType == other.grantType &&
        clientId == other.clientId &&
        clientSecret == other.clientSecret;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, grantType.hashCode);
    _$hash = $jc(_$hash, clientId.hashCode);
    _$hash = $jc(_$hash, clientSecret.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TokenRequest')
          ..add('grantType', grantType)
          ..add('clientId', clientId)
          ..add('clientSecret', clientSecret))
        .toString();
  }
}

class TokenRequestBuilder
    implements Builder<TokenRequest, TokenRequestBuilder> {
  _$TokenRequest? _$v;

  TokenRequestGrantTypeEnum? _grantType;
  TokenRequestGrantTypeEnum? get grantType => _$this._grantType;
  set grantType(TokenRequestGrantTypeEnum? grantType) =>
      _$this._grantType = grantType;

  String? _clientId;
  String? get clientId => _$this._clientId;
  set clientId(String? clientId) => _$this._clientId = clientId;

  String? _clientSecret;
  String? get clientSecret => _$this._clientSecret;
  set clientSecret(String? clientSecret) => _$this._clientSecret = clientSecret;

  TokenRequestBuilder() {
    TokenRequest._defaults(this);
  }

  TokenRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _grantType = $v.grantType;
      _clientId = $v.clientId;
      _clientSecret = $v.clientSecret;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TokenRequest other) {
    _$v = other as _$TokenRequest;
  }

  @override
  void update(void Function(TokenRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TokenRequest build() => _build();

  _$TokenRequest _build() {
    final _$result = _$v ??
        _$TokenRequest._(
          grantType: BuiltValueNullFieldError.checkNotNull(
              grantType, r'TokenRequest', 'grantType'),
          clientId: BuiltValueNullFieldError.checkNotNull(
              clientId, r'TokenRequest', 'clientId'),
          clientSecret: BuiltValueNullFieldError.checkNotNull(
              clientSecret, r'TokenRequest', 'clientSecret'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
