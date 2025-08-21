package go.atlas.backend.visit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Cookie;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Component
public class CookieHelper {

    private static final String VISITOR_COOKIE_NAME = "visitor-id";

    /**
     * This method ONLY finds a cookie. It returns an Optional.
     */
    public Optional<Cookie> getVisitorCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(c -> VISITOR_COOKIE_NAME.equals(c.getName()))
                .findFirst();
    }

    /**
     * This method ONLY creates a cookie. It returns a plain Cookie.
     */
    public Cookie createVisitorCookie() {
        String newVisitorId = UUID.randomUUID().toString();
        Cookie newCookie = new Cookie(VISITOR_COOKIE_NAME, newVisitorId);
        newCookie.setMaxAge(60 * 60 * 24 * 365); // 1 year
        newCookie.setPath("/");
        return newCookie;
    }
}