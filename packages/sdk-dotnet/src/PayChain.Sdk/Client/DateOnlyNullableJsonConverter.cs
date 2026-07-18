/*
 * PayChain Public API
 *
 * Tenant-facing API for loyalty integrations today and stablecoin workflows once readiness gates pass. The TypeScript SDK is published separately; other platforms can integrate directly from this contract.
 *
 * The version of the OpenAPI document: 0.1.0
 * Generated for PayChain internal and approved partner distribution.
 */

using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PayChain.Sdk.Client
{
    /// <summary>
    /// Formatter for 'date' openapi formats ss defined by full-date - RFC3339
    /// see https://spec.openapis.org/oas/v3.0.3
    /// </summary>
    public class DateOnlyNullableJsonConverter : JsonConverter<DateOnly?>
    {
        /// <summary>
        /// The formats used to deserialize the date
        /// </summary>
        public static string[] Formats { get; } = {
            "yyyy'-'MM'-'dd",
            "yyyyMMdd"

        };

        /// <summary>
        /// Returns a DateOnly from the Json object
        /// </summary>
        /// <param name="reader"></param>
        /// <param name="typeToConvert"></param>
        /// <param name="options"></param>
        /// <returns></returns>
        public override DateOnly? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            string value = reader.GetString()!;

            foreach(string format in Formats)
                if (DateOnly.TryParseExact(value, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateOnly result))
                    return result;

            throw new NotSupportedException();
        }

        /// <summary>
        /// Writes the DateOnly to the json writer
        /// </summary>
        /// <param name="writer"></param>
        /// <param name="dateOnlyValue"></param>
        /// <param name="options"></param>
        public override void Write(Utf8JsonWriter writer, DateOnly? dateOnlyValue, JsonSerializerOptions options)
        {
            if (dateOnlyValue == null)
                writer.WriteNullValue();
            else
                writer.WriteStringValue(dateOnlyValue.Value.ToString("yyyy'-'MM'-'dd", CultureInfo.InvariantCulture));
        }
    }
}
