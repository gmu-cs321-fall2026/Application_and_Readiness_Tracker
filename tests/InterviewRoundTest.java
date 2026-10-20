import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InterviewRoundTest {

    public static void main(String[] args) {

        roundsAreNumberedInOrder();
        roundsOnlyAllowedAtInterviewStatus();
        missingFieldsAreRejected();
        roundNumberBelowOneIsRejected();
        notesAreAppended();
        roundsAreSortedByDate();
        roundLookupBoundaries();
        unknownApplicationIsRejected();
        upcomingDependsOnDate();

        System.out.println("PASS: All interview round tests");
    }

    // Creates an application and moves it to the INTERVIEW status
    private static String newInterviewApplication(ApplicationTracker tracker) {
        Application application = tracker.createApplication(
                "Google", "Software Engineer",
                LocalDate.of(2026, 10, 19), "LinkedIn", null);
        String id = application.getId();
        tracker.updateStatus(id, ApplicationStatus.IN_PROGRESS);
        tracker.updateStatus(id, ApplicationStatus.APPLIED);
        tracker.updateStatus(id, ApplicationStatus.INTERVIEW);
        return id;
    }

    private static LocalDateTime date(int month, int day) {
        return LocalDateTime.of(2026, month, day, 10, 0);
    }

    // Round numbers should be 1, 2, 3 in the order they were added
    private static void roundsAreNumberedInOrder() {
        ApplicationTracker tracker = new ApplicationTracker();
        String id = newInterviewApplication(tracker);

        InterviewRound first = tracker.addInterviewRound(
                id, date(11, 3), InterviewFormat.PHONE, InterviewType.TECHNICAL);
        InterviewRound second = tracker.addInterviewRound(
                id, date(11, 10), InterviewFormat.VIDEO_CALL, InterviewType.BEHAVIORAL);
        InterviewRound third = tracker.addInterviewRound(
                id, date(11, 17), InterviewFormat.ON_SITE, InterviewType.FINAL_ROUND);

        check(first.getRoundNumber() == 1, "First round should be number 1");
        check(second.getRoundNumber() == 2, "Second round should be number 2");
        check(third.getRoundNumber() == 3, "Third round should be number 3");
        check(tracker.getInterviewRounds(id).size() == 3,
                "Application should have 3 rounds");
        System.out.println("PASS: Rounds are numbered in order");
    }

    // Rounds can only be added while the status is INTERVIEW
    private static void roundsOnlyAllowedAtInterviewStatus() {
        ApplicationTracker tracker = new ApplicationTracker();
        Application planned = tracker.createApplication(
                "Amazon", "Intern", LocalDate.of(2026, 10, 19), "Handshake", null);

        expectThrows(IllegalStateException.class, () ->
                tracker.addInterviewRound(planned.getId(), date(11, 3),
                        InterviewFormat.PHONE, InterviewType.TECHNICAL),
                "PLANNED status should reject a round");

        String id = newInterviewApplication(tracker);
        tracker.addInterviewRound(id, date(11, 3),
                InterviewFormat.PHONE, InterviewType.TECHNICAL);

        // Once the application is closed, rounds are no longer allowed
        tracker.updateStatus(id, ApplicationStatus.REJECTED);
        expectThrows(IllegalStateException.class, () ->
                tracker.addInterviewRound(id, date(11, 10),
                        InterviewFormat.PHONE, InterviewType.TECHNICAL),
                "REJECTED status should reject a round");
        System.out.println("PASS: Rounds only allowed at INTERVIEW status");
    }

    // Date, format, and type are all required
    private static void missingFieldsAreRejected() {
        expectThrows(NullPointerException.class, () ->
                new InterviewRound(1, null,
                        InterviewFormat.PHONE, InterviewType.TECHNICAL),
                "Null date should be rejected");
        expectThrows(NullPointerException.class, () ->
                new InterviewRound(1, date(11, 3),
                        null, InterviewType.TECHNICAL),
                "Null format should be rejected");
        expectThrows(NullPointerException.class, () ->
                new InterviewRound(1, date(11, 3),
                        InterviewFormat.PHONE, null),
                "Null type should be rejected");
        System.out.println("PASS: Missing fields are rejected");
    }

    // Boundary: round number 0 is invalid, 1 is the smallest valid number
    private static void roundNumberBelowOneIsRejected() {
        expectThrows(IllegalArgumentException.class, () ->
                new InterviewRound(0, date(11, 3),
                        InterviewFormat.PHONE, InterviewType.TECHNICAL),
                "Round number 0 should be rejected");
        new InterviewRound(1, date(11, 3),
                InterviewFormat.PHONE, InterviewType.TECHNICAL);
        System.out.println("PASS: Round number boundary");
    }

    // Notes are added after an interview and never overwrite earlier notes
    private static void notesAreAppended() {
        InterviewRound round = new InterviewRound(1, date(11, 3),
                InterviewFormat.PHONE, InterviewType.TECHNICAL);

        check(round.getNotes().isEmpty(), "New round should have no notes");

        round.appendNotes("Asked about graphs");
        check(round.getNotes().equals("Asked about graphs"),
                "First note should be saved as is");

        round.appendNotes("Follow up Friday");
        check(round.getNotes().contains("Asked about graphs")
                        && round.getNotes().contains("Follow up Friday"),
                "Second note should be added to the first");

        String before = round.getNotes();
        round.appendNotes(null);
        round.appendNotes("   ");
        check(round.getNotes().equals(before),
                "Null or blank notes should be ignored");
        System.out.println("PASS: Notes are appended");
    }

    // Rounds are listed by date, not by the order they were added
    private static void roundsAreSortedByDate() {
        ApplicationTracker tracker = new ApplicationTracker();
        String id = newInterviewApplication(tracker);

        tracker.addInterviewRound(id, date(11, 10),
                InterviewFormat.ON_CAMPUS, InterviewType.BEHAVIORAL);
        tracker.addInterviewRound(id, date(11, 3),
                InterviewFormat.VIDEO_CALL, InterviewType.TECHNICAL);

        List<InterviewRound> rounds = tracker.getInterviewRounds(id);
        check(rounds.get(0).getRoundNumber() == 2,
                "Earlier date (round 2) should be listed first");
        check(rounds.get(1).getRoundNumber() == 1,
                "Later date (round 1) should be listed second");
        System.out.println("PASS: Rounds are sorted by date");
    }

    // Boundaries around the valid round numbers (0, 1, last, last + 1)
    private static void roundLookupBoundaries() {
        ApplicationTracker tracker = new ApplicationTracker();
        String id = newInterviewApplication(tracker);
        tracker.addInterviewRound(id, date(11, 3),
                InterviewFormat.PHONE, InterviewType.TECHNICAL);
        tracker.addInterviewRound(id, date(11, 10),
                InterviewFormat.PHONE, InterviewType.BEHAVIORAL);

        expectThrows(IllegalArgumentException.class, () ->
                tracker.addInterviewNotes(id, 0, "x"), "Round 0 should not exist");
        tracker.addInterviewNotes(id, 1, "first");
        tracker.addInterviewNotes(id, 2, "last");
        expectThrows(IllegalArgumentException.class, () ->
                tracker.addInterviewNotes(id, 3, "x"), "Round 3 should not exist");

        check(tracker.getInterviewRounds(id).stream()
                        .anyMatch(r -> r.getNotes().equals("first")),
                "Notes should be saved on round 1");
        System.out.println("PASS: Round lookup boundaries");
    }

    private static void unknownApplicationIsRejected() {
        ApplicationTracker tracker = new ApplicationTracker();
        expectThrows(IllegalArgumentException.class, () ->
                tracker.getInterviewRounds("no-such-id"),
                "Unknown application ID should be rejected");
        System.out.println("PASS: Unknown application rejected");
    }

    private static void upcomingDependsOnDate() {
        InterviewRound past = new InterviewRound(1,
                LocalDateTime.now().minusMinutes(1),
                InterviewFormat.PHONE, InterviewType.TECHNICAL);
        InterviewRound future = new InterviewRound(2,
                LocalDateTime.now().plusMinutes(1),
                InterviewFormat.PHONE, InterviewType.TECHNICAL);

        check(!past.isUpcoming(), "A past interview should not be upcoming");
        check(future.isUpcoming(), "A future interview should be upcoming");
        System.out.println("PASS: Upcoming check");
    }

    // Smaller helpers: 

    private static void check(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError("Test failed: " + message);
        }
    }

    private static void expectThrows(
            Class<? extends Throwable> expected, Runnable action, String message) {
        try {
            action.run();
        } catch (Throwable thrown) {
            if (expected.isInstance(thrown)) {
                return;
            }
            throw new AssertionError("Test failed: " + message
                    + " (threw " + thrown.getClass().getSimpleName() + ")");
        }
        throw new AssertionError("Test failed: " + message + " (nothing thrown)");
    }
}
