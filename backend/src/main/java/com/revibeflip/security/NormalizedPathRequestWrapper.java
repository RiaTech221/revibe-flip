package com.revibeflip.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

/**
 * Enveloppe de requête HTTP exposant un chemin d'accès canonisé et normalisé.
 *
 * <p>Permet à Spring Security (requestMatchers) et Spring MVC (HandlerMapping)
 * d'évaluer exactement la même URL normalisée sans risque de contournement par variante.</p>
 */
public class NormalizedPathRequestWrapper extends HttpServletRequestWrapper {

    private final String normalizedUri;
    private final String normalizedServletPath;

    public NormalizedPathRequestWrapper(HttpServletRequest request, String normalizedUri, String normalizedServletPath) {
        super(request);
        this.normalizedUri = normalizedUri;
        this.normalizedServletPath = normalizedServletPath;
    }

    @Override
    public String getRequestURI() {
        return this.normalizedUri;
    }

    @Override
    public String getServletPath() {
        return this.normalizedServletPath;
    }

    @Override
    public String getPathInfo() {
        return null;
    }

    @Override
    public StringBuffer getRequestURL() {
        StringBuffer url = new StringBuffer();
        String scheme = getScheme();
        int port = getServerPort();
        url.append(scheme);
        url.append("://");
        url.append(getServerName());
        if ((scheme.equals("http") && port != 80) || (scheme.equals("https") && port != 443)) {
            url.append(':');
            url.append(port);
        }
        url.append(this.normalizedUri);
        return url;
    }
}
