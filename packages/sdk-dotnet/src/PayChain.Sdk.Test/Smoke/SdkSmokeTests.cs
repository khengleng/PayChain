using PayChain.Sdk.Model;
using Xunit;

namespace PayChain.Sdk.Test.Smoke
{
    public class SdkSmokeTests
    {
        [Fact]
        public void HealthModelStoresStatus()
        {
            var health = new Health("ok");

            Assert.Equal("ok", health.Status);
            Assert.Contains("Status: ok", health.ToString());
        }
    }
}
