<?php

namespace PayChainSdk\Test\Smoke;

use PayChainSdk\Api\HealthApi;
use PayChainSdk\Configuration;
use PayChainSdk\Model\Health;
use PHPUnit\Framework\TestCase;

final class SdkSmokeTest extends TestCase
{
    public function testHealthModelStoresStatus(): void
    {
        $health = new Health(['status' => 'ok']);

        self::assertSame('ok', $health->getStatus());
        self::assertTrue($health->valid());
    }

    public function testHealthApiUsesConfiguredHost(): void
    {
        $config = (new Configuration())->setHost('https://api.paychain.example');
        $api = new HealthApi(null, $config);

        self::assertSame('https://api.paychain.example', $api->getConfig()->getHost());
    }
}
