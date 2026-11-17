
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ApplicationTracker {
    private final List<Application> applications = new ArrayList<>();

    public Application createApplication(
            String employerName,
            String roleTitle,
            LocalDate applicationDate,
            String source,
            LocalDate deadline) {

        Application application = new Application(
            employerName, roleTitle, applicationDate, source, deadline);

        applications.add(application);
        return application;
    }

    // Create and validate the entire record before adding it.
    public Application createRecord(
            String employerName,
            String roleTitle,
            LocalDate applicationDate,
            String source,
            LocalDate deadline,
            ApplicationStatus status,
            String notes) {

        Application application = new Application(
            employerName, roleTitle, applicationDate, source, deadline);

        application.updateRecord(
            employerName, roleTitle, applicationDate,
            source, deadline, status, notes);

        applications.add(application);
        return application;
    }

    public Application findById(String id) {
        for (Application application : applications) {
            if (application.getId().equals(id)) {
                return application;
            }
        }
        throw new IllegalArgumentException("Application not found.");
    }

    public void deleteApplication(String id) {
        Application application = findById(id);
        applications.remove(application);
    }

    // Editing a record permits correcting an accidentally chosen status.
    public void updateRecord(
            String id,
            String employerName,
            String roleTitle,
            LocalDate applicationDate,
            String source,
            LocalDate deadline,
            ApplicationStatus status,
            String notes) {

        findById(id).updateRecord(
            employerName, roleTitle, applicationDate,
            source, deadline, status, notes);
    }

    // Preserve original transition rules for other callers.
    public void updateStatus(String id, ApplicationStatus newStatus) {
        Application application = findById(id);
        ApplicationStatus current = application.getStatus();

        if (newStatus == null) {
            throw new IllegalArgumentException("Status is required.");
        }
        if (current == newStatus) return;

        if (current == ApplicationStatus.ACCEPTED
                || current == ApplicationStatus.REJECTED
                || current == ApplicationStatus.WITHDRAWN) {
            throw new IllegalStateException(
                "Cannot update a closed application.");
        }

        if (newStatus == ApplicationStatus.REJECTED
                || newStatus == ApplicationStatus.WITHDRAWN) {
            application.setStatus(newStatus);
            return;
        }

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

        if (!valid) {
            throw new IllegalStateException(
                "Invalid transition: " + current + " -> " + newStatus);
        }

        application.setStatus(newStatus);
    }

    public void updateNotes(String id, String notes) {
        findById(id).setNotes(notes);
    }

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

    public List<Application> getAllApplications() {
        return new ArrayList<>(applications);
    }

    public List<Application> getPlannedApplications() {
        return getApplicationsByStatus(ApplicationStatus.PLANNED);
    }

    public List<Application> getInProgressApplications() {
        return getApplicationsByStatus(ApplicationStatus.IN_PROGRESS);
    }

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

    public InterviewRound addInterviewRound(
            String id,
            LocalDateTime scheduledAt,
            InterviewFormat format,
            InterviewType type) {

        Application application = findById(id);

        if (application.getStatus() != ApplicationStatus.INTERVIEW) {
            throw new IllegalStateException(
                "Interview rounds can only be added when the status is INTERVIEW.");
        }

        return application.addInterviewRound(scheduledAt, format, type);
    }

    public List<InterviewRound> getInterviewRounds(String id) {
        return findById(id).getInterviewRounds();
    }

    public void addInterviewNotes(
            String id, int roundNumber, String notes) {

        InterviewRound round = findById(id)
            .getInterviewRound(roundNumber)
            .orElseThrow(() -> new IllegalArgumentException(
                "Interview round not found."));

        round.appendNotes(notes);
    }
}
