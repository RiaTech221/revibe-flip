package com.revibeflip.service;

import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service de nettoyage HTML pour prévenir les injections XSS
 * même en provenance d'un compte administrateur.
 */
@Service
public class HtmlSanitizerService {

    // Balises strictement dangereuses à retirer avec leur contenu
    private static final Pattern DANGEROUS_TAGS_BLOCK = Pattern.compile(
            "<(script|style|iframe|object|embed|applet|form)[^>]*>.*?</\\1>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // Balises orphelines dangereuses
    private static final Pattern DANGEROUS_TAGS_SINGLE = Pattern.compile(
            "<(script|style|iframe|object|embed|applet|meta|link|input|button)[^>]*>",
            Pattern.CASE_INSENSITIVE
    );

    // Attributs d'événements JavaScript (onclick, onerror, onload, onmouseover, etc.)
    private static final Pattern EVENT_ATTRIBUTES = Pattern.compile(
            "\\s+on[a-zA-Z]+\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)",
            Pattern.CASE_INSENSITIVE
    );

    // Protocoles dangereux dans href/src (javascript:, vbscript:, data:)
    private static final Pattern DANGEROUS_PROTOCOLS = Pattern.compile(
            "(href|src)\\s*=\\s*(\"|')\\s*(javascript|vbscript|data):[^\"]*\\2",
            Pattern.CASE_INSENSITIVE
    );

    // Balises autorisées (liste blanche)
    private static final Pattern TAG_PATTERN = Pattern.compile("</?([a-zA-Z0-9]+)(\\s+[^>]*)?/?>");

    private static final java.util.Set<String> ALLOWED_TAGS = java.util.Set.of(
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "strike",
            "ul", "ol", "li", "blockquote", "pre", "code",
            "a", "img", "table", "thead", "tbody", "tr", "th", "td",
            "div", "span"
    );

    public String sanitize(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }

        // 1. Supprimer les blocs dangereux complets (<script>...</script>, <iframe>...</iframe>)
        String cleaned = DANGEROUS_TAGS_BLOCK.matcher(html).replaceAll("");

        // 2. Supprimer les balises dangereuses isolées
        cleaned = DANGEROUS_TAGS_SINGLE.matcher(cleaned).replaceAll("");

        // 3. Supprimer tous les gestionnaires d'événements JavaScript (onerror, onclick, onload...)
        cleaned = EVENT_ATTRIBUTES.matcher(cleaned).replaceAll("");

        // 4. Supprimer les liens javascript: et vbscript:
        cleaned = DANGEROUS_PROTOCOLS.matcher(cleaned).replaceAll("$1=\"#\"");

        // 5. Filtrer les balises selon la liste blanche
        Matcher matcher = TAG_PATTERN.matcher(cleaned);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String tagName = matcher.group(1).toLowerCase();
            if (ALLOWED_TAGS.contains(tagName)) {
                String fullTag = matcher.group(0);
                // Si c'est un lien <a> externe, forcer rel="noopener noreferrer"
                if ("a".equals(tagName) && fullTag.toLowerCase().contains("href=")) {
                    if (!fullTag.toLowerCase().contains("rel=")) {
                        fullTag = fullTag.replace(">", " rel=\"noopener noreferrer\" target=\"_blank\">");
                    }
                }
                matcher.appendReplacement(sb, Matcher.quoteReplacement(fullTag));
            } else {
                // Remplacer la balise non autorisée par vide
                matcher.appendReplacement(sb, "");
            }
        }
        matcher.appendTail(sb);

        return sb.toString();
    }
}
