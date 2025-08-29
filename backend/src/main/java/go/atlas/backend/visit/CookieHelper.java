package go.atlas.backend.visit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Cookie;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
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
    public ResponseCookie createVisitorCookie() {
        String newVisitorId = UUID.randomUUID().toString();

        return ResponseCookie.from(VISITOR_COOKIE_NAME, newVisitorId)
                .maxAge(Duration.ofDays(30))
                .path("/")
                .secure(true)
                .sameSite("None")
                .build();
    }
}