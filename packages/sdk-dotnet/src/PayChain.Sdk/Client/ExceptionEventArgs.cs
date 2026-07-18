/*
 * PayChain Public API
 *
 * Tenant-facing API for loyalty integrations today and stablecoin workflows once readiness gates pass. The TypeScript SDK is published separately; other platforms can integrate directly from this contract.
 *
 * The version of the OpenAPI document: 0.1.0
 * Generated for PayChain internal and approved partner distribution.
 */

using System;

namespace PayChain.Sdk.Client
{
    /// <summary>
    /// Useful for tracking server health
    /// </summary>
    public class ExceptionEventArgs : EventArgs
    {
        /// <summary>
        /// The ApiResponse
        /// </summary>
        public Exception Exception { get; }

        /// <summary>
        /// The ExceptionEventArgs
        /// </summary>
        /// <param name="exception"></param>
        public ExceptionEventArgs(Exception exception)
        {
            Exception = exception;
        }
    }
}
