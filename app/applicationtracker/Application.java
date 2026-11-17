
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class Application {
    private String id;
    private String employerName;
    private String roleTitle;
    private LocalDate applicationDate;
    private String source;
    private LocalDate deadline;
    private String notes;
    private ApplicationStatus status;

    private final List<InterviewRound> interviewRounds = new ArrayList<>();

    public Application(String employerName, String roleTitle,
                       LocalDate applicationDate, String source,
                       LocalDate deadline) {
        validateText(employerName, "Company");
        validateText(roleTitle, "Position");
        validateText(source, "Source");

        id = UUID.randomUUID().toString();
        this.employerName = employerName.trim();
        this.roleTitle = roleTitle.trim();
        this.applicationDate = applicationDate;
        this.source = source.trim();
        this.deadline = deadline;
        this.notes = "";
        this.status = ApplicationStatus.PLANNED;
    }

    private static void validateText(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " is required.");
        }
        if (value.trim().length() > 200) {
            throw new IllegalArgumentException(
                name + " cannot exceed 200 characters.");
        }
    }

    public static boolean isPlanningStatus(ApplicationStatus status) {
        return status == ApplicationStatus.PLANNED
            || status == ApplicationStatus.IN_PROGRESS;
    }

    public static void validateApplicationDate(
            ApplicationStatus status, LocalDate date) {

        if (status == null) {
            throw new IllegalArgumentException("Status is required.");
        }

        if (isPlanningStatus(status)) {
            if (date != null) {
                throw new IllegalArgumentException(
                    "Application date must be empty until you apply.");
            }
        } else {
            if (date == null) {
                throw new IllegalArgumentException(
                    "Application date is required for submitted applications.");
            }
            if (date.isAfter(LocalDate.now())) {
                throw new IllegalArgumentException(
                    "Application date cannot be in the future.");
            }
        }
    }

    public void setInitialStatus(ApplicationStatus initialStatus) {
        if (initialStatus == null) {
            throw new IllegalArgumentException("Initial status is required.");
        }
        if (status != ApplicationStatus.PLANNED) {
            throw new IllegalStateException(
                "Initial status already assigned.");
        }
        validateApplicationDate(initialStatus, applicationDate);
        status = initialStatus;
    }

    void restoreIdentity(String savedId) {
        if (savedId == null || savedId.isBlank()) {
            throw new IllegalArgumentException("Saved ID is required.");
        }
        id = savedId;
    }

    // Restore legacy records without changing historical data.
    void restoreStatus(ApplicationStatus savedStatus) {
        if (savedStatus == null) {
            throw new IllegalArgumentException("Saved status is required.");
        }
        this.status = savedStatus;
    }

    public String getId() { return id; }
    public String getEmployerName() { return employerName; }
    public String getRoleTitle() { return roleTitle; }
    public LocalDate getApplicationDate() { return applicationDate; }
    public String getSource() { return source; }
    public LocalDate getDeadline() { return deadline; }
    public String getNotes() { return notes; }
    public ApplicationStatus getStatus() { return status; }

    public void setNotes(String notes) {
        this.notes = notes == null ? "" : notes.trim();
    }

    void setStatus(ApplicationStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("Status is required.");
        }
        validateApplicationDate(status, applicationDate);
        this.status = status;
    }

    // Validate everything before modifying any existing field.
    public void updateRecord(
            String employerName,
            String roleTitle,
            LocalDate applicationDate,
            String source,
            LocalDate deadline,
            ApplicationStatus status,
            String notes) {

        validateText(employerName, "Company");
        validateText(roleTitle, "Position");
        validateText(source, "Source");
        validateApplicationDate(status, applicationDate);

        this.employerName = employerName.trim();
        this.roleTitle = roleTitle.trim();
        this.applicationDate = applicationDate;
        this.source = source.trim();
        this.deadline = deadline;
        this.status = status;
        this.notes = notes == null ? "" : notes.trim();
    }

    // Retained for compatibility with existing Java code.
    public void updateDetails(
            String employerName,
            String roleTitle,
            LocalDate applicationDate,
            String source,
            LocalDate deadline) {

        updateRecord(
            employerName, roleTitle, applicationDate,
            source, deadline, status, notes);
    }

    public InterviewRound addInterviewRound(
            LocalDateTime scheduledAt,
            InterviewFormat format,
            InterviewType type) {

        int nextNumber = interviewRounds.stream()
            .mapToInt(InterviewRound::getRoundNumber)
            .max().orElse(0) + 1;

        InterviewRound round = new InterviewRound(
            nextNumber, scheduledAt, format, type);

        interviewRounds.add(round);
        return round;
    }

    public List<InterviewRound> getInterviewRounds() {
        List<InterviewRound> sorted = new ArrayList<>(interviewRounds);
        sorted.sort(Comparator.comparing(
            InterviewRound::getScheduledAt));
        return Collections.unmodifiableList(sorted);
    }

    public Optional<InterviewRound> getInterviewRound(int roundNumber) {
        return interviewRounds.stream()
            .filter(round -> round.getRoundNumber() == roundNumber)
            .findFirst();
    }

    @Override
    public String toString() {
        return employerName + " | " + roleTitle
            + " | " + status
            + " | Date: " + applicationDate
            + " | Source: " + source
            + " | Deadline: " + (deadline == null ? "N/A" : deadline)
            + " | Notes: " + notes;
    }


    // Used only to roll back an unsuccessful persistence operation.
    void restoreRecord(
            String employerName,
            String roleTitle,
            LocalDate applicationDate,
            String source,
            LocalDate deadline,
            ApplicationStatus status,
            String notes) {

        this.employerName = employerName;
        this.roleTitle = roleTitle;
        this.applicationDate = applicationDate;
        this.source = source;
        this.deadline = deadline;
        this.status = status;
        this.notes = notes;
    }

}
