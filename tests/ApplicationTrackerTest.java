
import java.time.LocalDate;

public class ApplicationTrackerTest {

    public static void main(String[] args) {

        ApplicationTracker tracker = new ApplicationTracker();

        Application application = tracker.createApplication(
                "Google",
                "Software Engineer",
                LocalDate.of(2026, 10, 19),
                "LinkedIn",
                LocalDate.of(2026, 11, 1)
        );

        // Verify that the application was saved
        Application found = tracker.findById(application.getId());

        if (found != application) {
            throw new AssertionError(
                    "Test failed: Application was not saved correctly.");
        }

        System.out.println("PASS: Application creation test");
    }
}
