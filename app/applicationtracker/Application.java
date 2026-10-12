/*
 * Represents one job application and stores its information.
 */

import java.time.LocalDate;
import java.util.UUID;

// Represents a single job or internship application
public class Application {

    // Each application has a unique identifier
    private final String id;

    // Information about the application
    private String employerName;
    private String roleTitle;
    private LocalDate applicationDate;
    private String source;
    private LocalDate deadline;
    private String notes;
    private ApplicationStatus status;

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
