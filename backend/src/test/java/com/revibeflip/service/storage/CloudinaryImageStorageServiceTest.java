package com.revibeflip.service.storage;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CloudinaryImageStorageServiceTest {

    @Test
    void store_includesTransformationAndSignedFolder_forProductsAndAvatars() throws Exception {
        CloudinaryImageStorageService service = new CloudinaryImageStorageService(
                "demo-cloud", "demo-key", "demo-secret", "revibeflip"
        );
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.createServer(restTemplate);

        server.expect(requestTo("https://api.cloudinary.com/v1_1/demo-cloud/image/upload"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().string(containsString("revibeflip/products")))
                .andExpect(content().string(containsString("c_limit,w_1600,h_1600,q_auto:good,f_auto")))
                .andRespond(withSuccess(
                        "{\"secure_url\":\"https://res.cloudinary.com/demo-cloud/image/upload/v1/revibeflip/products/p1.webp\"}",
                        MediaType.APPLICATION_JSON
                ));

        String productUrl = service.store("img".getBytes(StandardCharsets.UTF_8), "products", ".jpg", "image/jpeg");
        assertThat(productUrl).startsWith("https://res.cloudinary.com/demo-cloud/image/upload/");
        server.verify();

        server.reset();
        server.expect(requestTo("https://api.cloudinary.com/v1_1/demo-cloud/image/upload"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().string(containsString("revibeflip/avatars")))
                .andExpect(content().string(containsString("c_fill,g_face,w_500,h_500,q_auto:good,f_auto")))
                .andRespond(withSuccess(
                        "{\"secure_url\":\"https://res.cloudinary.com/demo-cloud/image/upload/v1/revibeflip/avatars/a1.webp\"}",
                        MediaType.APPLICATION_JSON
                ));

        String avatarUrl = service.store("img".getBytes(StandardCharsets.UTF_8), "avatars", ".png", "image/png");
        assertThat(avatarUrl).startsWith("https://res.cloudinary.com/demo-cloud/image/upload/");
        server.verify();
    }
}
