package go.atlas.backend.visit;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class VisitService {

    private final VisitRepository visitRepository;
    private static final Long COUNTER_ID = 1L;

    public VisitService(VisitRepository visitRepository) {
        this.visitRepository = visitRepository;
    }

    @Transactional
    public long incrementAndGetCount() {
        VisitorCount counter = visitRepository.findById(COUNTER_ID)
                .orElse(new VisitorCount(0L));

        counter.setCount(counter.getCount() + 1);
        visitRepository.save(counter);

        return  counter.getCount();
    }

    public long getCurrentCount() {
        return visitRepository.findById(COUNTER_ID)
                .map(VisitorCount::getCount)
                .orElse(0L);
    }
}