package com.revibeflip.sms;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ConfigurableHttpSmsProviderTest {

    @Test
    void sendSms_intechFormat_sendsAppKeySenderContentAndMsisdnArray() {
        SmsProperties props = new SmsProperties();
        props.setProvider("intech");
        props.setApiUrl("https://gateway.intechsms.sn/api/send-sms");
        props.setApiKey("intech-secret-app-key");
        props.setSenderId("ReVibeFliP");

        ConfigurableHttpSmsProvider provider = new ConfigurableHttpSmsProvider(props, new MockEnvironment());
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(provider, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.createServer(restTemplate);

        server.expect(requestTo("https://gateway.intechsms.sn/api/send-sms"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.app_key").value("intech-secret-app-key"))
                .andExpect(jsonPath("$.sender").value("ReVibeFliP"))
                .andExpect(jsonPath("$.content").value("Votre code OTP est 123456"))
                .andExpect(jsonPath("$.msisdn[0]").value("+221771234567"))
                .andRespond(withSuccess("{\"status\":\"ok\"}", MediaType.APPLICATION_JSON));

        provider.sendSms("+221771234567", "Votre code OTP est 123456");
        server.verify();
    }
}
