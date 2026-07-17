// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'webhook_endpoint_with_secret.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$WebhookEndpointWithSecret extends WebhookEndpointWithSecret {
  @override
  final String secret;
  @override
  final String id;
  @override
  final String url;
  @override
  final BuiltList<String> events;
  @override
  final String status;
  @override
  final DateTime createdAt;

  factory _$WebhookEndpointWithSecret(
          [void Function(WebhookEndpointWithSecretBuilder)? updates]) =>
      (WebhookEndpointWithSecretBuilder()..update(updates))._build();

  _$WebhookEndpointWithSecret._(
      {required this.secret,
      required this.id,
      required this.url,
      required this.events,
      required this.status,
      required this.createdAt})
      : super._();
  @override
  WebhookEndpointWithSecret rebuild(
          void Function(WebhookEndpointWithSecretBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  WebhookEndpointWithSecretBuilder toBuilder() =>
      WebhookEndpointWithSecretBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is WebhookEndpointWithSecret &&
        secret == other.secret &&
        id == other.id &&
        url == other.url &&
        events == other.events &&
        status == other.status &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, secret.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, events.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'WebhookEndpointWithSecret')
          ..add('secret', secret)
          ..add('id', id)
          ..add('url', url)
          ..add('events', events)
          ..add('status', status)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class WebhookEndpointWithSecretBuilder
    implements
        Builder<WebhookEndpointWithSecret, WebhookEndpointWithSecretBuilder>,
        WebhookEndpointBuilder {
  _$WebhookEndpointWithSecret? _$v;

  String? _secret;
  String? get secret => _$this._secret;
  set secret(covariant String? secret) => _$this._secret = secret;

  String? _id;
  String? get id => _$this._id;
  set id(covariant String? id) => _$this._id = id;

  String? _url;
  String? get url => _$this._url;
  set url(covariant String? url) => _$this._url = url;

  ListBuilder<String>? _events;
  ListBuilder<String> get events => _$this._events ??= ListBuilder<String>();
  set events(covariant ListBuilder<String>? events) => _$this._events = events;

  String? _status;
  String? get status => _$this._status;
  set status(covariant String? status) => _$this._status = status;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(covariant DateTime? createdAt) => _$this._createdAt = createdAt;

  WebhookEndpointWithSecretBuilder() {
    WebhookEndpointWithSecret._defaults(this);
  }

  WebhookEndpointWithSecretBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _secret = $v.secret;
      _id = $v.id;
      _url = $v.url;
      _events = $v.events.toBuilder();
      _status = $v.status;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(covariant WebhookEndpointWithSecret other) {
    _$v = other as _$WebhookEndpointWithSecret;
  }

  @override
  void update(void Function(WebhookEndpointWithSecretBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  WebhookEndpointWithSecret build() => _build();

  _$WebhookEndpointWithSecret _build() {
    _$WebhookEndpointWithSecret _$result;
    try {
      _$result = _$v ??
          _$WebhookEndpointWithSecret._(
            secret: BuiltValueNullFieldError.checkNotNull(
                secret, r'WebhookEndpointWithSecret', 'secret'),
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'WebhookEndpointWithSecret', 'id'),
            url: BuiltValueNullFieldError.checkNotNull(
                url, r'WebhookEndpointWithSecret', 'url'),
            events: events.build(),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'WebhookEndpointWithSecret', 'status'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'WebhookEndpointWithSecret', 'createdAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'events';
        events.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'WebhookEndpointWithSecret', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
