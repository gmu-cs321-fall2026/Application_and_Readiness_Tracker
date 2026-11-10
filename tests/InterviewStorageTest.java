import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class InterviewStorageTest {

    private static final Path FILE = Path.of("data", "interviews.tsv");

    public static void main(String[] args) throws IOException {

        // The storage class always uses data/interviews.tsv, so keep the
        // real file safe and put it back when the tests finish
        byte[] backup = Files.exists(FILE) ? Files.readAllBytes(FILE) : null;
        boolean dataFolderExisted = Files.exists(FILE.getParent());

        try {
            saveWritesOneLinePerRound();
            roundsSurviveSaveAndLoad();
            roundsAddedOutOfDateOrderSurviveReload();
            missingFileLoadsNothing();
            badRecordIsRejected();
            unknownApplicationIsRejected();
            wrongRoundNumberIsRejected();
        } finally {
            if (backup != null) {
                Files.write(FILE, backup);
            } else {
                Files.deleteIfExists(FILE);
                if (!dataFolderExisted) {
                    Files.deleteIfExists(FILE.getParent());
                }
            }
        }

        System.out.println("PASS: All interview storage tests");
    }

    // Creates an application and moves it to the INTERVIEW status
    private static Application newInterviewApplication(
            ApplicationTracker tracker) {
        Application application = tracker.createApplication(
                "Apple", "Software Engineer",
                LocalDate.of(2026, 11, 10), "LinkedIn", null);
        String id = application.getId();
        tracker.updateStatus(id, ApplicationStatus.IN_PROGRESS);
        tracker.updateStatus(id, ApplicationStatus.APPLIED);
        tracker.updateStatus(id, ApplicationStatus.INTERVIEW);
        return application;
    }

    // Creates an application with no interview rounds, like one that has
    // just been restored from storage
    private static Application newPlainApplication(ApplicationTracker tracker) {
        return tracker.createApplication(
                "Apple", "Software Engineer",
                LocalDate.of(2026, 11, 10), "LinkedIn", null);
    }

    private static LocalDateTime date(int month, int day) {
        return LocalDateTime.of(2026, month, day, 14, 30);
    }

    // Each saved round becomes one line with six fields
    private static void saveWritesOneLinePerRound() throws IOException {
        ApplicationTracker tracker = new ApplicationTracker();
        Application app = newInterviewApplication(tracker);
        app.addInterviewRound(date(11, 3),
                InterviewFormat.PHONE, InterviewType.TECHNICAL);
        app.addInterviewRound(date(11, 10),
                InterviewFormat.VIDEO_CALL, InterviewType.BEHAVIORAL);
        app.addInterviewRound(date(11, 17),
                InterviewFormat.ON_SITE, InterviewType.FINAL_ROUND);

        InterviewStorage.save(List.of(app));

        List<String> lines = Files.readAllLines(FILE, StandardCharsets.UTF_8);
        check(lines.size() == 3, "Three rounds should be saved as three lines");
        for (String line : lines) {
            check(line.split("\t", -1).length == 6,
                    "Each saved line should have six fields");
        }
        System.out.println("PASS: Save writes one line per round");
    }

    // Rounds, formats, types, dates and notes should all come back
    private static void roundsSurviveSaveAndLoad() throws IOException {
        ApplicationTracker before = new ApplicationTracker();
        Application saved = newInterviewApplication(before);
        saved.addInterviewRound(date(11, 3),
                InterviewFormat.PHONE, InterviewType.TECHNICAL);
        saved.addInterviewRound(date(11, 10),
                InterviewFormat.ON_CAMPUS, InterviewType.BEHAVIORAL);
        // notes with a tab, a new line and special characters
        saved.getInterviewRound(1).get()
                .setNotes("Asked about graphs\tand\nrecursion caf\u00e9 \u2713");
        saved.getInterviewRound(2).get().setNotes("");

        InterviewStorage.save(List.of(saved));

        // a new tracker stands in for the server after a restart
        ApplicationTracker after = new ApplicationTracker();
        Application restored = newPlainApplication(after);
        pointSavedRoundsAt(restored);
        InterviewStorage.load(after);

        checkSameRounds(saved, restored, 2);
        System.out.println("PASS: Rounds survive save and load");
    }

    // Rounds do not have to be added in date order. Round 1 can be a
    // later date than round 2, and both must still load correctly
    private static void roundsAddedOutOfDateOrderSurviveReload()
            throws IOException {
        ApplicationTracker before = new ApplicationTracker();
        Application saved = newInterviewApplication(before);
        saved.addInterviewRound(date(11, 10),
                InterviewFormat.ON_CAMPUS, InterviewType.BEHAVIORAL);
        saved.addInterviewRound(date(11, 3),
                InterviewFormat.VIDEO_CALL, InterviewType.TECHNICAL);
        saved.getInterviewRound(1).get().setNotes("first added");

        InterviewStorage.save(List.of(saved));

        ApplicationTracker after = new ApplicationTracker();
        Application restored = newPlainApplication(after);
        pointSavedRoundsAt(restored);
        InterviewStorage.load(after);

        checkSameRounds(saved, restored, 2);
        System.out.println("PASS: Rounds added out of date order reload");
    }

    // No saved file is fine, there is just nothing to restore
    private static void missingFileLoadsNothing() throws IOException {
        Files.deleteIfExists(FILE);
        ApplicationTracker tracker = new ApplicationTracker();
        Application app = newPlainApplication(tracker);

        InterviewStorage.load(tracker);

        check(app.getInterviewRounds().isEmpty(),
                "No file should mean no rounds");
        System.out.println("PASS: Missing file loads nothing");
    }

    private static void badRecordIsRejected() throws IOException {
        writeFile("only\ttwo");
        ApplicationTracker tracker = new ApplicationTracker();
        newPlainApplication(tracker);

        expectIoFailure(tracker, "A line without six fields should be rejected");
        System.out.println("PASS: Bad record is rejected");
    }

    private static void unknownApplicationIsRejected() throws IOException {
        writeFile(String.join("\t",
                encode("no-such-id"), encode("1"), encode("2026-11-03T14:30"),
                encode("PHONE"), encode("TECHNICAL"), encode("")));
        ApplicationTracker tracker = new ApplicationTracker();
        newPlainApplication(tracker);

        expectIoFailure(tracker, "An unknown application ID should be rejected");
        System.out.println("PASS: Unknown application is rejected");
    }

    private static void wrongRoundNumberIsRejected() throws IOException {
        ApplicationTracker tracker = new ApplicationTracker();
        Application app = newPlainApplication(tracker);
        writeFile(String.join("\t",
                encode(app.getId()), encode("2"), encode("2026-11-03T14:30"),
                encode("PHONE"), encode("TECHNICAL"), encode("")));

        expectIoFailure(tracker, "Round 2 with no round 1 should be rejected");
        System.out.println("PASS: Wrong round number is rejected");
    }

    // ---------------- small helpers ----------------

    // Both applications get their IDs at random, so the saved file is
    // changed to refer to the restored application
    private static void pointSavedRoundsAt(Application restored)
            throws IOException {
        List<String> updated = new ArrayList<>();
        for (String line : Files.readAllLines(FILE, StandardCharsets.UTF_8)) {
            String[] parts = line.split("\t", -1);
            parts[0] = encode(restored.getId());
            updated.add(String.join("\t", parts));
        }
        Files.write(FILE, updated, StandardCharsets.UTF_8);
    }

    private static void checkSameRounds(
            Application saved, Application restored, int expectedCount) {
        check(restored.getInterviewRounds().size() == expectedCount,
                "Restored application should have " + expectedCount + " rounds");
        for (int number = 1; number <= expectedCount; number++) {
            InterviewRound a = saved.getInterviewRound(number).get();
            InterviewRound b = restored.getInterviewRound(number)
                    .orElseThrow(() -> new AssertionError(
                            "Test failed: a round was not restored"));
            check(a.getScheduledAt().equals(b.getScheduledAt()),
                    "Round " + number + " date and time should match");
            check(a.getFormat() == b.getFormat(),
                    "Round " + number + " format should match");
            check(a.getType() == b.getType(),
                    "Round " + number + " type should match");
            check(a.getNotes().equals(b.getNotes()),
                    "Round " + number + " notes should match");
        }
    }

    private static void writeFile(String... lines) throws IOException {
        Files.createDirectories(FILE.getParent());
        Files.write(FILE, List.of(lines), StandardCharsets.UTF_8);
    }

    private static String encode(String value) {
        return Base64.getEncoder().encodeToString(
                value.getBytes(StandardCharsets.UTF_8));
    }

    private static void check(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError("Test failed: " + message);
        }
    }

    // Loading should fail with an IOException and nothing else
    private static void expectIoFailure(
            ApplicationTracker tracker, String message) {
        try {
            InterviewStorage.load(tracker);
        } catch (IOException expected) {
            return;
        } catch (Throwable other) {
            throw new AssertionError("Test failed: " + message
                    + " (threw " + other.getClass().getSimpleName() + ")");
        }
        throw new AssertionError("Test failed: " + message
                + " (nothing thrown)");
    }
}
