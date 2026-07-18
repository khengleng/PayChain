/*
 * PayChain Public API
 *
 * Tenant-facing API for loyalty integrations today and stablecoin workflows once readiness gates pass. The TypeScript SDK is published separately; other platforms can integrate directly from this contract.
 *
 * The version of the OpenAPI document: 0.1.0
 * Generated for PayChain internal and approved partner distribution.
 */

#nullable enable

using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PayChain.Sdk.Client;

namespace PayChain.Sdk.Extensions
{
    /// <summary>
    /// Extension methods for IHostBuilder
    /// </summary>
    public static class IHostBuilderExtensions
    {
        /// <summary>
        /// Add the api to your host builder.
        /// </summary>
        /// <param name="builder"></param>
        /// <param name="options"></param>
        public static IHostBuilder ConfigureApi(this IHostBuilder builder, Action<HostBuilderContext, IServiceCollection, HostConfiguration> options)
        {
            builder.ConfigureServices((context, services) => 
            {
                HostConfiguration config = new HostConfiguration(services);

                options(context, services, config);

                IServiceCollectionExtensions.AddApi(services, config);
            });

            return builder;
        }
    }
}
