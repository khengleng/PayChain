/*
 * PayChain Public API
 *
 * Tenant-facing API for loyalty integrations today and stablecoin workflows once readiness gates pass. The TypeScript SDK is published separately; other platforms can integrate directly from this contract.
 *
 * The version of the OpenAPI document: 0.1.0
 * Generated for PayChain internal and approved partner distribution.
 */

using System;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Generic;
using System.Security.Cryptography;
using PayChain.Sdk.Client;
using PayChain.Sdk.Api;
using PayChain.Sdk.Extensions;
using Xunit;

namespace PayChain.Sdk.Test.Api
{
    /// <summary>
    ///  Tests the dependency injection.
    /// </summary>
    public class DependencyInjectionTest
    {
        private readonly IHost _hostUsingConfigureWithoutAClient =
            Host.CreateDefaultBuilder([]).ConfigureApi((context, services, options) =>
            {
                OAuthToken oauthToken1 = new("token", timeout: TimeSpan.FromSeconds(1));
                options.AddTokens(oauthToken1);
            })
            .Build();

        private readonly IHost _hostUsingConfigureWithAClient =
            Host.CreateDefaultBuilder([]).ConfigureApi((context, services, options) =>
            {
                OAuthToken oauthToken1 = new("token", timeout: TimeSpan.FromSeconds(1));
                options.AddTokens(oauthToken1);
                options.AddApiHttpClients(client => client.BaseAddress = new Uri(ClientUtils.BASE_ADDRESS));
            })
            .Build();

        private readonly IHost _hostUsingAddWithoutAClient =
            Host.CreateDefaultBuilder([]).ConfigureServices((host, services) =>
            {
                services.AddApi(options =>
                {
                    OAuthToken oauthToken1 = new("token", timeout: TimeSpan.FromSeconds(1));
                    options.AddTokens(oauthToken1);
                });
            })
            .Build();

        private readonly IHost _hostUsingAddWithAClient =
            Host.CreateDefaultBuilder([]).ConfigureServices((host, services) =>
            {
                services.AddApi(options =>
                {
                    OAuthToken oauthToken1 = new("token", timeout: TimeSpan.FromSeconds(1));
                    options.AddTokens(oauthToken1);
                    options.AddApiHttpClients(client => client.BaseAddress = new Uri(ClientUtils.BASE_ADDRESS));
                });
            })
            .Build();

        /// <summary>
        /// Test dependency injection when using the configure method
        /// </summary>
        [Fact]
        public void ConfigureApiWithAClientTest()
        {
            var assetsApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<IAssetsApi>();
            Assert.True(assetsApi.HttpClient.BaseAddress != null);

            var authApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<IAuthApi>();
            Assert.True(authApi.HttpClient.BaseAddress != null);

            var docsApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<IDocsApi>();
            Assert.True(docsApi.HttpClient.BaseAddress != null);

            var healthApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<IHealthApi>();
            Assert.True(healthApi.HttpClient.BaseAddress != null);

            var stablecoinWorkflowsApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<IStablecoinWorkflowsApi>();
            Assert.True(stablecoinWorkflowsApi.HttpClient.BaseAddress != null);

            var stablecoinsApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<IStablecoinsApi>();
            Assert.True(stablecoinsApi.HttpClient.BaseAddress != null);

            var transactionsApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<ITransactionsApi>();
            Assert.True(transactionsApi.HttpClient.BaseAddress != null);

            var walletsApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<IWalletsApi>();
            Assert.True(walletsApi.HttpClient.BaseAddress != null);

            var webhooksApi = _hostUsingConfigureWithAClient.Services.GetRequiredService<IWebhooksApi>();
            Assert.True(webhooksApi.HttpClient.BaseAddress != null);
        }

        /// <summary>
        /// Test dependency injection when using the configure method
        /// </summary>
        [Fact]
        public void ConfigureApiWithoutAClientTest()
        {
            var assetsApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<IAssetsApi>();
            Assert.True(assetsApi.HttpClient.BaseAddress != null);

            var authApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<IAuthApi>();
            Assert.True(authApi.HttpClient.BaseAddress != null);

            var docsApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<IDocsApi>();
            Assert.True(docsApi.HttpClient.BaseAddress != null);

            var healthApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<IHealthApi>();
            Assert.True(healthApi.HttpClient.BaseAddress != null);

            var stablecoinWorkflowsApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<IStablecoinWorkflowsApi>();
            Assert.True(stablecoinWorkflowsApi.HttpClient.BaseAddress != null);

            var stablecoinsApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<IStablecoinsApi>();
            Assert.True(stablecoinsApi.HttpClient.BaseAddress != null);

            var transactionsApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<ITransactionsApi>();
            Assert.True(transactionsApi.HttpClient.BaseAddress != null);

            var walletsApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<IWalletsApi>();
            Assert.True(walletsApi.HttpClient.BaseAddress != null);

            var webhooksApi = _hostUsingConfigureWithoutAClient.Services.GetRequiredService<IWebhooksApi>();
            Assert.True(webhooksApi.HttpClient.BaseAddress != null);
        }

        /// <summary>
        /// Test dependency injection when using the add method
        /// </summary>
        [Fact]
        public void AddApiWithAClientTest()
        {
            var assetsApi = _hostUsingAddWithAClient.Services.GetRequiredService<IAssetsApi>();
            Assert.True(assetsApi.HttpClient.BaseAddress != null);
            
            var authApi = _hostUsingAddWithAClient.Services.GetRequiredService<IAuthApi>();
            Assert.True(authApi.HttpClient.BaseAddress != null);
            
            var docsApi = _hostUsingAddWithAClient.Services.GetRequiredService<IDocsApi>();
            Assert.True(docsApi.HttpClient.BaseAddress != null);
            
            var healthApi = _hostUsingAddWithAClient.Services.GetRequiredService<IHealthApi>();
            Assert.True(healthApi.HttpClient.BaseAddress != null);
            
            var stablecoinWorkflowsApi = _hostUsingAddWithAClient.Services.GetRequiredService<IStablecoinWorkflowsApi>();
            Assert.True(stablecoinWorkflowsApi.HttpClient.BaseAddress != null);
            
            var stablecoinsApi = _hostUsingAddWithAClient.Services.GetRequiredService<IStablecoinsApi>();
            Assert.True(stablecoinsApi.HttpClient.BaseAddress != null);
            
            var transactionsApi = _hostUsingAddWithAClient.Services.GetRequiredService<ITransactionsApi>();
            Assert.True(transactionsApi.HttpClient.BaseAddress != null);
            
            var walletsApi = _hostUsingAddWithAClient.Services.GetRequiredService<IWalletsApi>();
            Assert.True(walletsApi.HttpClient.BaseAddress != null);
            
            var webhooksApi = _hostUsingAddWithAClient.Services.GetRequiredService<IWebhooksApi>();
            Assert.True(webhooksApi.HttpClient.BaseAddress != null);
        }

        /// <summary>
        /// Test dependency injection when using the add method
        /// </summary>
        [Fact]
        public void AddApiWithoutAClientTest()
        {
            var assetsApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<IAssetsApi>();
            Assert.True(assetsApi.HttpClient.BaseAddress != null);

            var authApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<IAuthApi>();
            Assert.True(authApi.HttpClient.BaseAddress != null);

            var docsApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<IDocsApi>();
            Assert.True(docsApi.HttpClient.BaseAddress != null);

            var healthApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<IHealthApi>();
            Assert.True(healthApi.HttpClient.BaseAddress != null);

            var stablecoinWorkflowsApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<IStablecoinWorkflowsApi>();
            Assert.True(stablecoinWorkflowsApi.HttpClient.BaseAddress != null);

            var stablecoinsApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<IStablecoinsApi>();
            Assert.True(stablecoinsApi.HttpClient.BaseAddress != null);

            var transactionsApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<ITransactionsApi>();
            Assert.True(transactionsApi.HttpClient.BaseAddress != null);

            var walletsApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<IWalletsApi>();
            Assert.True(walletsApi.HttpClient.BaseAddress != null);

            var webhooksApi = _hostUsingAddWithoutAClient.Services.GetRequiredService<IWebhooksApi>();
            Assert.True(webhooksApi.HttpClient.BaseAddress != null);
        }
    }
}
