package com.revibeflip.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RateLimitAndBotFilterTests {

    @Test
    void blocksKnownVulnerabilityScannerUserAgent() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");
        request.addHeader("User-Agent", "sqlmap/1.7.2#stable");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus());
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void ignoresSpoofedXForwardedForAndRateLimitsByRealIp() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/contact");
            req.addHeader("X-Real-IP", "198.51.100.42");
            req.addHeader("X-Forwarded-For", "203.0.113." + i);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, chain);
            assertEquals(200, res.getStatus());
        }

        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/contact");
        blockedReq.addHeader("X-Real-IP", "198.51.100.42");
        blockedReq.addHeader("X-Forwarded-For", "203.0.113.99");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        filter.doFilter(blockedReq, blockedRes, chain);

        assertEquals(429, blockedRes.getStatus());
        verify(chain, times(10)).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void turnstileFilterBlocksMissingTokenWhenEnabledAndAllowsValidToken() throws Exception {
        TurnstileService turnstileService = mock(TurnstileService.class);
        when(turnstileService.isEnabled()).thenReturn(true);
        when(turnstileService.verifyToken("valid-token", "198.51.100.10")).thenReturn(true);
        when(turnstileService.verifyToken(null, "198.51.100.10")).thenReturn(false);

        TurnstileFilter filter = new TurnstileFilter(turnstileService, new RateLimitFilter());
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest missingTokenReq = new MockHttpServletRequest("POST", "/api/auth/register");
        missingTokenReq.addHeader("CF-Connecting-IP", "198.51.100.10");
        MockHttpServletResponse missingTokenRes = new MockHttpServletResponse();
        filter.doFilter(missingTokenReq, missingTokenRes, chain);
        assertEquals(403, missingTokenRes.getStatus());
        verify(chain, never()).doFilter(missingTokenReq, missingTokenRes);

        MockHttpServletRequest validReq = new MockHttpServletRequest("POST", "/api/auth/register");
        validReq.addHeader("CF-Connecting-IP", "198.51.100.10");
        validReq.addHeader("X-Turnstile-Token", "valid-token");
        MockHttpServletResponse validRes = new MockHttpServletResponse();
        filter.doFilter(validReq, validRes, chain);
        assertEquals(200, validRes.getStatus());
        verify(chain, times(1)).doFilter(validReq, validRes);
    }
}
