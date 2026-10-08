/*
 * Manages all applications, including adding applications, updating statuses, and organizing them into sections.
 */

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Manages all applications in the tracker
public class ApplicationTracker {

    // Stores applications while the program is running
    private final List<Application> applications = new ArrayList<>();

    // Creates a new application and adds it to the tracker
    public Application createApplication(
            String employerName,
            String roleTitle,
            LocalDate applicationDate,
            String source,
            LocalDate deadline) {

        // Application constructor validates required fields
        Application application = new Application(
                employerName, roleTitle, applicationDate,
                source, deadline
        );

        applications.add(application);
        return application;
    }

    // Finds an application using its unique ID
    public Application findById(String id) {
        for (Application application : applications) {
            if (application.getId().equals(id)) {
                return application;
            }
        }

        throw new IllegalArgumentException("Application not found.");
    }

    // Updates an application's status after checking the transition
    public void updateStatus(String id, ApplicationStatus newStatus) {

        Application application = findById(id);
        ApplicationStatus current = application.getStatus();

        if (newStatus == null) {
            throw new IllegalArgumentException("Status is required.");
        }

        // No change is needed if the status is already correct
        if (current == newStatus) {
            return;
        }

        // Closed applications cannot be updated
        if (current == ApplicationStatus.ACCEPTED
                || current == ApplicationStatus.REJECTED
                || current == ApplicationStatus.WITHDRAWN) {
            throw new IllegalStateException(
                    "Cannot update a closed application.");
        }

        // Applications can be rejected or withdrawn at any active stage
        if (newStatus == ApplicationStatus.REJECTED
                || newStatus == ApplicationStatus.WITHDRAWN) {
            application.setStatus(newStatus);
            return;
        }

        // Define which status transitions are allowed
        boolean valid = switch (current) {

            case PLANNED ->
                newStatus == ApplicationStatus.IN_PROGRESS;

            case IN_PROGRESS ->
                newStatus == ApplicationStatus.APPLIED;

            case APPLIED ->
                newStatus == ApplicationStatus.ONLINE_ASSESSMENT
                || newStatus == ApplicationStatus.PHONE_SCREEN
                || newStatus == ApplicationStatus.INTERVIEW
                || newStatus == ApplicationStatus.OFFER;

            case ONLINE_ASSESSMENT ->
                newStatus == ApplicationStatus.PHONE_SCREEN
                || newStatus == ApplicationStatus.INTERVIEW
                || newStatus == ApplicationStatus.OFFER;

            case PHONE_SCREEN ->
                newStatus == ApplicationStatus.INTERVIEW
                || newStatus == ApplicationStatus.OFFER;

            case INTERVIEW ->
                newStatus == ApplicationStatus.OFFER;

            case OFFER ->
                newStatus == ApplicationStatus.ACCEPTED;

            default -> false;
        };

        // Reject invalid status transitions
        if (!valid) {
            throw new IllegalStateException(
                    "Invalid transition: " + current + " -> " + newStatus);
        }

        // Save the updated status
        application.setStatus(newStatus);
    }

    // Updates notes for a specific application
    public void updateNotes(String id, String notes) {
        Application application = findById(id);
        application.setNotes(notes);
    }

    // Returns applications with a specific status
    public List<Application> getApplicationsByStatus(
            ApplicationStatus status) {

        List<Application> result = new ArrayList<>();

        for (Application application : applications) {
            if (application.getStatus() == status) {
                result.add(application);
            }
        }

        return result;
    }

    // Returns applications in the Plan to Apply section
    public List<Application> getPlannedApplications() {
        return getApplicationsByStatus(ApplicationStatus.PLANNED);
    }

    // Returns applications in the In Progress section
    public List<Application> getInProgressApplications() {
        return getApplicationsByStatus(ApplicationStatus.IN_PROGRESS);
    }

    // Returns all submitted applications, including later stages
    public List<Application> getAppliedApplications() {

        List<Application> result = new ArrayList<>();

        for (Application application : applications) {
            ApplicationStatus status = application.getStatus();

            if (status != ApplicationStatus.PLANNED
                    && status != ApplicationStatus.IN_PROGRESS) {
                result.add(application);
            }
        }

        return result;
    }
}
