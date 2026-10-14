/*
 * Q&I cross-review tests for Subsystem 2 (Application & Readiness Tracker), Sprint 2.
 *
 * Tests the tracker logic directly (no HTTP yet).
 *
 */

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

public class ApplicationTrackerTest {

    private static final LocalDate DATE = LocalDate.of(2026, 10, 1);

    // Creates a fresh tracker with one valid application in it.
    private ApplicationTracker tracker;
    private Application app;

    private void setUp() {
        tracker = new ApplicationTracker();
        app = tracker.createApplication("Google", "SWE Intern", DATE, "Handshake", null);
    }

    // Moves the test application through a list of statuses in order.
    private void moveTo(ApplicationStatus... path) {
        for (ApplicationStatus s : path) {
            tracker.updateStatus(app.getId(), s);
        }
    }

    private void moveToOffer() {
        moveTo(ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.OFFER);
    }

    // ---------- Creating applications ----------

    @Test
    @DisplayName("New application starts as PLANNED with an ID and empty notes")
    void newApplicationDefaults() {
        setUp();
        assertEquals(ApplicationStatus.PLANNED, app.getStatus());
        assertNotNull(app.getId());
        assertEquals("", app.getNotes());
        assertNull(app.getDeadline());
    }

    @Test
    @DisplayName("Text fields are trimmed when saved")
    void fieldsAreTrimmed() {
        Application a = new ApplicationTracker()
                .createApplication("  Google  ", " SWE Intern ", DATE, " Referral ", null);
        assertEquals("Google", a.getEmployerName());
        assertEquals("SWE Intern", a.getRoleTitle());
        assertEquals("Referral", a.getSource());
    }

    @Test
    @DisplayName("Each application gets a different ID")
    void idsAreUnique() {
        setUp();
        Application second = tracker.createApplication("Apple", "Intern", DATE, "Direct", null);
        assertNotEquals(app.getId(), second.getId());
    }

    @Test
    @DisplayName("Missing employer, role, date or source is rejected")
    void requiredFieldsAreChecked() {
        ApplicationTracker t = new ApplicationTracker();
        assertThrows(IllegalArgumentException.class, () -> t.createApplication(null, "Role", DATE, "Src", null));
        assertThrows(IllegalArgumentException.class, () -> t.createApplication("   ", "Role", DATE, "Src", null));
        assertThrows(IllegalArgumentException.class, () -> t.createApplication("Emp", "", DATE, "Src", null));
        assertThrows(IllegalArgumentException.class, () -> t.createApplication("Emp", "Role", null, "Src", null));
        assertThrows(IllegalArgumentException.class, () -> t.createApplication("Emp", "Role", DATE, " ", null));
    }

    @Test
    @DisplayName("A rejected application is not saved")
    void invalidApplicationNotSaved() {
        ApplicationTracker t = new ApplicationTracker();
        assertThrows(IllegalArgumentException.class, () -> t.createApplication("", "Role", DATE, "Src", null));
        assertTrue(t.getPlannedApplications().isEmpty());
    }

    // ---------- Status changes: allowed ----------

    @Test
    @DisplayName("Full pipeline Planned -> ... -> Accepted is allowed")
    void fullPipelineAllowed() {
        setUp();
        moveTo(ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED,
               ApplicationStatus.ONLINE_ASSESSMENT, ApplicationStatus.PHONE_SCREEN,
               ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER, ApplicationStatus.ACCEPTED);
        assertEquals(ApplicationStatus.ACCEPTED, app.getStatus());
    }

    @Test
    @DisplayName("Applied can skip straight to Interview or Offer")
    void appliedCanSkipAhead() {
        setUp();
        moveTo(ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW);
        assertEquals(ApplicationStatus.INTERVIEW, app.getStatus());

        setUp();
        moveTo(ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.OFFER);
        assertEquals(ApplicationStatus.OFFER, app.getStatus());
    }

    @Test
    @DisplayName("Rejected or Withdrawn is allowed from every active stage")
    void rejectOrWithdrawFromAnyActiveStage() {
        ApplicationStatus[][] paths = {
            {},
            {ApplicationStatus.IN_PROGRESS},
            {ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED},
            {ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.ONLINE_ASSESSMENT},
            {ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.PHONE_SCREEN},
            {ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW},
            {ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.OFFER},
        };
        for (ApplicationStatus end : new ApplicationStatus[]{ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN}) {
            for (ApplicationStatus[] path : paths) {
                setUp();
                moveTo(path);
                tracker.updateStatus(app.getId(), end);
                assertEquals(end, app.getStatus());
            }
        }
    }

    @Test
    @DisplayName("Setting the same status again changes nothing")
    void sameStatusIsNoOp() {
        setUp();
        moveTo(ApplicationStatus.IN_PROGRESS, ApplicationStatus.IN_PROGRESS);
        assertEquals(ApplicationStatus.IN_PROGRESS, app.getStatus());
    }

    // ---------- Status changes: blocked ----------

    @Test
    @DisplayName("Planned cannot jump to Applied or Accepted")
    void plannedCannotJump() {
        setUp();
        assertThrows(IllegalStateException.class, () -> tracker.updateStatus(app.getId(), ApplicationStatus.APPLIED));
        assertThrows(IllegalStateException.class, () -> tracker.updateStatus(app.getId(), ApplicationStatus.ACCEPTED));
        assertEquals(ApplicationStatus.PLANNED, app.getStatus());
    }

    @Test
    @DisplayName("Status cannot move backwards")
    void cannotMoveBackwards() {
        setUp();
        moveTo(ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW);
        assertThrows(IllegalStateException.class, () -> tracker.updateStatus(app.getId(), ApplicationStatus.PHONE_SCREEN));
        assertThrows(IllegalStateException.class, () -> tracker.updateStatus(app.getId(), ApplicationStatus.PLANNED));
        assertEquals(ApplicationStatus.INTERVIEW, app.getStatus());
    }

    @Test
    @DisplayName("Accepted can only be reached from Offer")
    void acceptedOnlyFromOffer() {
        setUp();
        moveTo(ApplicationStatus.IN_PROGRESS, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW);
        assertThrows(IllegalStateException.class, () -> tracker.updateStatus(app.getId(), ApplicationStatus.ACCEPTED));
    }

    @Test
    @DisplayName("Closed applications (Accepted, Rejected, Withdrawn) are locked")
    void closedApplicationsAreLocked() {
        setUp();
        moveToOffer();
        tracker.updateStatus(app.getId(), ApplicationStatus.ACCEPTED);
        assertThrows(IllegalStateException.class, () -> tracker.updateStatus(app.getId(), ApplicationStatus.WITHDRAWN));

        setUp();
        tracker.updateStatus(app.getId(), ApplicationStatus.REJECTED);
        assertThrows(IllegalStateException.class, () -> tracker.updateStatus(app.getId(), ApplicationStatus.IN_PROGRESS));

        setUp();
        tracker.updateStatus(app.getId(), ApplicationStatus.WITHDRAWN);
        assertThrows(IllegalStateException.class, () -> tracker.updateStatus(app.getId(), ApplicationStatus.REJECTED));
    }

    @Test
    @DisplayName("Null status and unknown ID are rejected")
    void badStatusInput() {
        setUp();
        assertThrows(IllegalArgumentException.class, () -> tracker.updateStatus(app.getId(), null));
        assertThrows(IllegalArgumentException.class, () -> tracker.updateStatus("no-such-id", ApplicationStatus.IN_PROGRESS));
    }

    // ---------- Notes ----------

    @Test
    @DisplayName("Notes are saved, trimmed, and null becomes empty")
    void notesUpdate() {
        setUp();
        tracker.updateNotes(app.getId(), "  Recruiter: Sam  ");
        assertEquals("Recruiter: Sam", app.getNotes());
        tracker.updateNotes(app.getId(), null);
        assertEquals("", app.getNotes());
        assertThrows(IllegalArgumentException.class, () -> tracker.updateNotes("no-such-id", "x"));
    }

    // ---------- View sections ----------

    @Test
    @DisplayName("Applications appear in the right section")
    void sectionsGroupCorrectly() {
        ApplicationTracker t = new ApplicationTracker();
        Application planned = t.createApplication("A", "R", DATE, "S", null);
        Application inProgress = t.createApplication("B", "R", DATE, "S", null);
        Application interview = t.createApplication("C", "R", DATE, "S", null);
        t.updateStatus(inProgress.getId(), ApplicationStatus.IN_PROGRESS);
        t.updateStatus(interview.getId(), ApplicationStatus.IN_PROGRESS);
        t.updateStatus(interview.getId(), ApplicationStatus.APPLIED);
        t.updateStatus(interview.getId(), ApplicationStatus.INTERVIEW);

        assertEquals(List.of(planned), t.getPlannedApplications());
        assertEquals(List.of(inProgress), t.getInProgressApplications());
        assertEquals(List.of(interview), t.getAppliedApplications());
    }

    @Test
    @DisplayName("QUESTION: Rejected and Withdrawn applications are listed under Applied")
    void closedApplicationsShowUnderApplied() {
        // Documents current behavior. Confirm with Subsystem 2 whether closed
        // applications should appear under "Applied" or in their own section.
        ApplicationTracker t = new ApplicationTracker();
        Application withdrawn = t.createApplication("A", "R", DATE, "S", null);
        t.updateStatus(withdrawn.getId(), ApplicationStatus.WITHDRAWN);
        assertEquals(List.of(withdrawn), t.getAppliedApplications());
    }

    // ---------- Readiness checklist ----------

    private String printed(Checklist c) {
        PrintStream original = System.out;
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        System.setOut(new PrintStream(buffer));
        try {
            c.printItems();
        } finally {
            System.setOut(original);
        }
        return buffer.toString();
    }

    @Test
    @DisplayName("Checklist starts with 8 items, none done")
    void checklistDefaults() {
        String out = printed(new Checklist());
        assertTrue(out.contains("Progress: 0 of 8 complete"));
        assertTrue(out.contains("Mock interview completed"));
    }

    @Test
    @DisplayName("Toggling an item marks it done, toggling again undoes it")
    void checklistToggle() {
        Checklist c = new Checklist();
        assertTrue(c.toggleItem(1));
        assertTrue(printed(c).contains("Progress: 1 of 8 complete"));
        assertTrue(c.toggleItem(1));
        assertTrue(printed(c).contains("Progress: 0 of 8 complete"));
    }

    @Test
    @DisplayName("Out-of-range item numbers are rejected")
    void checklistBadNumbers() {
        Checklist c = new Checklist();
        assertFalse(c.toggleItem(0));
        assertFalse(c.toggleItem(9));
        assertFalse(c.toggleItem(-1));
    }

    @Test
    @DisplayName("Custom items are added to the end of the list")
    void checklistCustomItem() {
        Checklist c = new Checklist();
        c.addCustomItem("Thank-you email template");
        assertTrue(c.toggleItem(9));
        String out = printed(c);
        assertTrue(out.contains("Thank-you email template (Custom)"));
        assertTrue(out.contains("Progress: 1 of 9 complete"));
    }
}
