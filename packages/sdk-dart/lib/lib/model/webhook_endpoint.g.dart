// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'webhook_endpoint.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

abstract class WebhookEndpointBuilder {
  void replace(WebhookEndpoint other);
  void update(void Function(WebhookEndpointBuilder) updates);
  String? get id;
  set id(String? id);

  String? get url;
  set url(String? url);

  ListBuilder<String> get events;
  set events(ListBuilder<String>? events);

  String? get status;
  set status(String? status);

  DateTime? get createdAt;
  set createdAt(DateTime? createdAt);
}

class _$$WebhookEndpoint extends $WebhookEndpoint {
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

  factory _$$WebhookEndpoint(
          [void Function($WebhookEndpointBuilder)? updates]) =>
      ($WebhookEndpointBuilder()..update(updates))._build();

  _$$WebhookEndpoint._(
      {required this.id,
      required this.url,
      required this.events,
      required this.status,
      required this.createdAt})
      : super._();
  @override
  $WebhookEndpoint rebuild(void Function($WebhookEndpointBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  $WebhookEndpointBuilder toBuilder() =>
      $WebhookEndpointBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is $WebhookEndpoint &&
        id == other.id &&
        url == other.url &&
        events == other.events &&
        status == other.status &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
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
    return (newBuiltValueToStringHelper(r'$WebhookEndpoint')
          ..add('id', id)
          ..add('url', url)
          ..add('events', events)
          ..add('status', status)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class $WebhookEndpointBuilder
    implements
        Builder<$WebhookEndpoint, $WebhookEndpointBuilder>,
        WebhookEndpointBuilder {
  _$$WebhookEndpoint? _$v;

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

  $WebhookEndpointBuilder() {
    $WebhookEndpoint._defaults(this);
  }

  $WebhookEndpointBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
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
  void replace(covariant $WebhookEndpoint other) {
    _$v = other as _$$WebhookEndpoint;
  }

  @override
  void update(void Function($WebhookEndpointBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  $WebhookEndpoint build() => _build();

  _$$WebhookEndpoint _build() {
    _$$WebhookEndpoint _$result;
    try {
      _$result = _$v ??
          _$$WebhookEndpoint._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'$WebhookEndpoint', 'id'),
            url: BuiltValueNullFieldError.checkNotNull(
                url, r'$WebhookEndpoint', 'url'),
            events: events.build(),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'$WebhookEndpoint', 'status'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'$WebhookEndpoint', 'createdAt'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'events';
        events.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'$WebhookEndpoint', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
