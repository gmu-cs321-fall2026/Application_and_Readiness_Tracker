/*
 * Defines the possible stages of a job application.
 * Each application can have only one current status.
 */
public enum ApplicationStatus {
    PLANNED,             // Student plans to apply
    IN_PROGRESS,         // Student is working on the application
    APPLIED,             // Application has been submitted
    ONLINE_ASSESSMENT,   // Student is completing an assessment
    PHONE_SCREEN,        // Student has a phone screening
    INTERVIEW,           // Student is interviewing
    OFFER,               // Student received an offer
    ACCEPTED,            // Student accepted the offer
    REJECTED,            // Application was rejected
    WITHDRAWN            // Student withdrew the application
}
