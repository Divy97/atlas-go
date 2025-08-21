package go.atlas.backend.visit;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
public class VisitController {

    private VisitService visitorService;
    private CookieHelper cookieHelper;

    public VisitController(VisitService visitorService, CookieHelper cookieHelper) {
        this.visitorService = visitorService;
        this.cookieHelper = cookieHelper;
    }

    @GetMapping("/visit")
    public String trackVisitor(HttpServletRequest request, HttpServletResponse response) {
        Optional<Cookie> cookieOpt = cookieHelper.getVisitorCookie(request);

        long currentCount;
        String message;

        if (cookieOpt.isEmpty()) {
            currentCount = visitorService.incrementAndGetCount();
            response.addCookie(cookieHelper.createVisitorCookie());
            message = "Welcome! You are a new visitor. ";
        } else {
            currentCount = visitorService.getCurrentCount();
            message = "Welcome back! ";
        }

        return message + "Total unique visitors: " + currentCount;
    }
}