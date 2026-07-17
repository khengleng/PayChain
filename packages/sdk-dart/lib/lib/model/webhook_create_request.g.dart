// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'webhook_create_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$WebhookCreateRequest extends WebhookCreateRequest {
  @override
  final String url;
  @override
  final BuiltList<String> events;

  factory _$WebhookCreateRequest(
          [void Function(WebhookCreateRequestBuilder)? updates]) =>
      (WebhookCreateRequestBuilder()..update(updates))._build();

  _$WebhookCreateRequest._({required this.url, required this.events})
      : super._();
  @override
  WebhookCreateRequest rebuild(
          void Function(WebhookCreateRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  WebhookCreateRequestBuilder toBuilder() =>
      WebhookCreateRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is WebhookCreateRequest &&
        url == other.url &&
        events == other.events;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, events.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'WebhookCreateRequest')
          ..add('url', url)
          ..add('events', events))
        .toString();
  }
}

class WebhookCreateRequestBuilder
    implements Builder<WebhookCreateRequest, WebhookCreateRequestBuilder> {
  _$WebhookCreateRequest? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  ListBuilder<String>? _events;
  ListBuilder<String> get events => _$this._events ??= ListBuilder<String>();
  set events(ListBuilder<String>? events) => _$this._events = events;

  WebhookCreateRequestBuilder() {
    WebhookCreateRequest._defaults(this);
  }

  WebhookCreateRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _url = $v.url;
      _events = $v.events.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(WebhookCreateRequest other) {
    _$v = other as _$WebhookCreateRequest;
  }

  @override
  void update(void Function(WebhookCreateRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  WebhookCreateRequest build() => _build();

  _$WebhookCreateRequest _build() {
    _$WebhookCreateRequest _$result;
    try {
      _$result = _$v ??
          _$WebhookCreateRequest._(
            url: BuiltValueNullFieldError.checkNotNull(
                url, r'WebhookCreateRequest', 'url'),
            events: events.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'events';
        events.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'WebhookCreateRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
