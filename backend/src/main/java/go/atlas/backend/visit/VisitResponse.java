package go.atlas.backend.visit;

public class VisitResponse {

    private Long count;

    public VisitResponse(Long count) {
        this.count = count;
    }

    public VisitResponse() {
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}
