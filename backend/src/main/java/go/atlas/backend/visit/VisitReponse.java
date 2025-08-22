package go.atlas.backend.visit;

public class VisitReponse {

    private Long count;

    public VisitReponse(Long count) {
        this.count = count;
    }

    public VisitReponse() {
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }
}
