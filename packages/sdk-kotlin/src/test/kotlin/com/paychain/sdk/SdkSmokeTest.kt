package com.paychain.sdk

import com.paychain.sdk.apis.HealthApi
import com.paychain.sdk.models.Health
import io.kotlintest.shouldBe
import io.kotlintest.specs.ShouldSpec

class SdkSmokeTest : ShouldSpec({
    should("construct the health model") {
        Health("ok").status shouldBe "ok"
    }

    should("build the health request config") {
        val api = HealthApi("https://api.paychain.example")
        api.getHealthRequestConfig().path shouldBe "/api/v1/health"
    }
})
