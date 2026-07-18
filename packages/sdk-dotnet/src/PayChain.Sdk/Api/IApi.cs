/*
 * PayChain Public API
 *
 * Tenant-facing API for loyalty integrations today and stablecoin workflows once readiness gates pass. The TypeScript SDK is published separately; other platforms can integrate directly from this contract.
 *
 * The version of the OpenAPI document: 0.1.0
 * Generated for PayChain internal and approved partner distribution.
 */

using System.Net.Http;

namespace PayChain.Sdk.Api
{
    /// <summary>
    /// Any Api client
    /// </summary>
    public interface IApi
    {
        /// <summary>
        /// The HttpClient
        /// </summary>
        HttpClient HttpClient { get; }
    }
}
