//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:dio/dio.dart';
import 'package:built_value/serializer.dart';
import 'package:paychain_sdk/lib/serializers.dart';
import 'package:paychain_sdk/lib/auth/api_key_auth.dart';
import 'package:paychain_sdk/lib/auth/basic_auth.dart';
import 'package:paychain_sdk/lib/auth/bearer_auth.dart';
import 'package:paychain_sdk/lib/auth/oauth.dart';
import 'package:paychain_sdk/lib/api/assets_api.dart';
import 'package:paychain_sdk/lib/api/auth_api.dart';
import 'package:paychain_sdk/lib/api/docs_api.dart';
import 'package:paychain_sdk/lib/api/health_api.dart';
import 'package:paychain_sdk/lib/api/stablecoin_workflows_api.dart';
import 'package:paychain_sdk/lib/api/stablecoins_api.dart';
import 'package:paychain_sdk/lib/api/transactions_api.dart';
import 'package:paychain_sdk/lib/api/wallets_api.dart';
import 'package:paychain_sdk/lib/api/webhooks_api.dart';

class PaychainSdk {
  static const String basePath = r'https://api.paychain.cambobia.com';

  final Dio dio;
  final Serializers serializers;

  PaychainSdk({
    Dio? dio,
    Serializers? serializers,
    String? basePathOverride,
    List<Interceptor>? interceptors,
  })  : this.serializers = serializers ?? standardSerializers,
        this.dio = dio ??
            Dio(BaseOptions(
              baseUrl: basePathOverride ?? basePath,
              connectTimeout: const Duration(milliseconds: 5000),
              receiveTimeout: const Duration(milliseconds: 3000),
            )) {
    if (interceptors == null) {
      this.dio.interceptors.addAll([
        OAuthInterceptor(),
        BasicAuthInterceptor(),
        BearerAuthInterceptor(),
        ApiKeyAuthInterceptor(),
      ]);
    } else {
      this.dio.interceptors.addAll(interceptors);
    }
  }

  void setOAuthToken(String name, String token) {
    if (this.dio.interceptors.any((i) => i is OAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is OAuthInterceptor) as OAuthInterceptor).tokens[name] = token;
    }
  }

  /// Removes the OAuth token associated with the given [name].
  ///
  /// If no [OAuthInterceptor] is registered or no token exists for the given
  /// [name], this method has no effect.
  void removeOAuthToken(String name) {
    if (this.dio.interceptors.any((i) => i is OAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is OAuthInterceptor) as OAuthInterceptor).tokens.remove(name);
    }
  }

  void setBearerAuth(String name, String token) {
    if (this.dio.interceptors.any((i) => i is BearerAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BearerAuthInterceptor) as BearerAuthInterceptor).tokens[name] = token;
    }
  }

  /// Removes the bearer authentication token associated with the given [name].
  ///
  /// If no [BearerAuthInterceptor] is registered or no token exists for the
  /// given [name], this method has no effect.
  void removeBearerAuth(String name) {
    if (this.dio.interceptors.any((i) => i is BearerAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BearerAuthInterceptor) as BearerAuthInterceptor).tokens.remove(name);
    }
  }

  void setBasicAuth(String name, String username, String password) {
    if (this.dio.interceptors.any((i) => i is BasicAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BasicAuthInterceptor) as BasicAuthInterceptor).authInfo[name] = BasicAuthInfo(username, password);
    }
  }

  /// Removes the basic authentication credentials associated with the given [name].
  ///
  /// If no [BasicAuthInterceptor] is registered or no credentials exist for the
  /// given [name], this method has no effect.
  void removeBasicAuth(String name) {
    if (this.dio.interceptors.any((i) => i is BasicAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BasicAuthInterceptor) as BasicAuthInterceptor).authInfo.remove(name);
    }
  }

  void setApiKey(String name, String apiKey) {
    if (this.dio.interceptors.any((i) => i is ApiKeyAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((element) => element is ApiKeyAuthInterceptor) as ApiKeyAuthInterceptor).apiKeys[name] = apiKey;
    }
  }

  /// Removes the API key associated with the given [name].
  ///
  /// If no [ApiKeyAuthInterceptor] is registered or no API key exists for the
  /// given [name], this method has no effect.
  void removeApiKey(String name) {
    if (this.dio.interceptors.any((i) => i is ApiKeyAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((element) => element is ApiKeyAuthInterceptor) as ApiKeyAuthInterceptor).apiKeys.remove(name);
    }
  }

  /// Get AssetsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AssetsApi getAssetsApi() {
    return AssetsApi(dio, serializers);
  }

  /// Get AuthApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  AuthApi getAuthApi() {
    return AuthApi(dio, serializers);
  }

  /// Get DocsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  DocsApi getDocsApi() {
    return DocsApi(dio, serializers);
  }

  /// Get HealthApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  HealthApi getHealthApi() {
    return HealthApi(dio, serializers);
  }

  /// Get StablecoinWorkflowsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  StablecoinWorkflowsApi getStablecoinWorkflowsApi() {
    return StablecoinWorkflowsApi(dio, serializers);
  }

  /// Get StablecoinsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  StablecoinsApi getStablecoinsApi() {
    return StablecoinsApi(dio, serializers);
  }

  /// Get TransactionsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  TransactionsApi getTransactionsApi() {
    return TransactionsApi(dio, serializers);
  }

  /// Get WalletsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  WalletsApi getWalletsApi() {
    return WalletsApi(dio, serializers);
  }

  /// Get WebhooksApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  WebhooksApi getWebhooksApi() {
    return WebhooksApi(dio, serializers);
  }
}
