/*
 * Represents one job application and stores its information.
 */

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

// Represents a single job or internship application
public class Application {

    // Each application has a unique identifier
    private String id;

    // Information about the application
    private String employerName;
    private String roleTitle;
    private LocalDate applicationDate;
    private String source;
    private LocalDate deadline;
    private String notes;
    private ApplicationStatus status;

    // All interview rounds for this application
    private final List<InterviewRound> interviewRounds = new ArrayList<>();

    // Constructor creates a new application
    public Application(String employerName, String roleTitle,
                       LocalDate applicationDate, String source,
                       LocalDate deadline) {

        // Validate required fields before creating the record
        if (employerName == null || employerName.trim().isEmpty()) {
            throw new IllegalArgumentException("Employer name is required.");
        }

        if (roleTitle == null || roleTitle.trim().isEmpty()) {
            throw new IllegalArgumentException("Role title is required.");
        }

        if (applicationDate == null) {
            throw new IllegalArgumentException("Application date is required.");
        }

        if (source == null || source.trim().isEmpty()) {
            throw new IllegalArgumentException("Application source is required.");
        }

        // Generate a unique ID for each application
        this.id = UUID.randomUUID().toString();

        // Save the application information
        this.employerName = employerName.trim();
        this.roleTitle = roleTitle.trim();
        this.applicationDate = applicationDate;
        this.source = source.trim();
        this.deadline = deadline;

        // New applications start in the PLANNED stage
        this.status = ApplicationStatus.PLANNED;
        this.notes = "";
    }


    // Allows an initial status when an existing application is first recorded.
    // Later status changes still follow ApplicationTracker's transition rules.
    public void setInitialStatus(ApplicationStatus initialStatus) {
        if (initialStatus == null) {
            throw new IllegalArgumentException("Initial status is required.");
        }
        if (status != ApplicationStatus.PLANNED) {
            throw new IllegalStateException("Initial status already assigned.");
        }
        this.status = initialStatus;
    }


    // Restore the original ID when loading an application from storage.
    void restoreIdentity(String savedId) {
        if (savedId == null || savedId.isBlank()) {
            throw new IllegalArgumentException("Saved ID is required.");
        }
        this.id = savedId;
    }

    // Getter methods allow other classes to read application data
    public String getId() {
        return id;
    }

    public String getEmployerName() {
        return employerName;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public LocalDate getApplicationDate() {
        return applicationDate;
    }

    public String getSource() {
        return source;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public String getNotes() {
        return notes;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    // Updates notes associated with the application
    public void setNotes(String notes) {
        this.notes = notes == null ? "" : notes.trim();
    }

    // Updates status; tracker validates transitions first
    void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    // Adds a new interview round; round numbers go 1, 2, 3...
    public InterviewRound addInterviewRound(
            LocalDateTime scheduledAt,
            InterviewFormat format,
            InterviewType type) {

        InterviewRound round = new InterviewRound(
                interviewRounds.size() + 1, scheduledAt, format, type);
        interviewRounds.add(round);
        return round;
    }

    // Returns interview rounds sorted by date (read-only copy)
    public List<InterviewRound> getInterviewRounds() {
        List<InterviewRound> sorted = new ArrayList<>(interviewRounds);
        sorted.sort(Comparator.comparing(InterviewRound::getScheduledAt));
        return Collections.unmodifiableList(sorted);
    }

    // Finds an interview round by its number
    public Optional<InterviewRound> getInterviewRound(int roundNumber) {
        return interviewRounds.stream()
                .filter(r -> r.getRoundNumber() == roundNumber)
                .findFirst();
    }


    // Updates editable application information.
    public void updateDetails(String employerName, String roleTitle,
            LocalDate applicationDate, String source, LocalDate deadline) {
        if (employerName == null || employerName.trim().isEmpty()
                || roleTitle == null || roleTitle.trim().isEmpty()
                || applicationDate == null
                || source == null || source.trim().isEmpty()) {
            throw new IllegalArgumentException("Required fields cannot be empty.");
        }

        this.employerName = employerName.trim();
        this.roleTitle = roleTitle.trim();
        this.applicationDate = applicationDate;
        this.source = source.trim();
        this.deadline = deadline;
    }

    // Controls how application details are displayed
    @Override
    public String toString() {
        return employerName + " | " + roleTitle
                + " | " + status
                + " | Date: " + applicationDate
                + " | Source: " + source
                + " | Deadline: " + (deadline == null ? "N/A" : deadline)
                + " | Notes: " + notes;
    }
}
