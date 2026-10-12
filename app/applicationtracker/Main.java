/*
 * Runs the application and lets users interact with the tracker through the terminal.
 */

import java.time.LocalDate;
import java.util.List;
import java.util.Scanner;

// Main entry point for the Application Tracker
public class Main {

    // Create one tracker to manage all applications
    private static final ApplicationTracker tracker =
            new ApplicationTracker();

    // Scanner reads input from the user
    private static final Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) {

        boolean running = true;

        // Keep displaying the menu until the user exits
        while (running) {

            System.out.println("\n=== APPLICATION TRACKER ===");
            System.out.println("1. Add Application");
            System.out.println("2. View Applications");
            System.out.println("3. Update Application Status");
            System.out.println("4. Add Notes");
            System.out.println("5. Exit");
            System.out.print("Choose an option: ");

            String choice = scanner.nextLine();

            try {
                switch (choice) {
                    case "1" -> addApplication();
                    case "2" -> viewApplications();
                    case "3" -> updateApplication();
                    case "4" -> addNotes();
                    case "5" -> running = false;
                    default -> System.out.println("Invalid option.");
                }
            } catch (IllegalArgumentException | IllegalStateException e) {
                // Display errors without crashing the program
                System.out.println("Error: " + e.getMessage());
            }
        }

        scanner.close();
    }

    // Collects information and creates a new application
    private static void addApplication() {

        System.out.print("Employer name: ");
        String employer = scanner.nextLine();

        System.out.print("Role title: ");
        String role = scanner.nextLine();

        System.out.print("Application date (YYYY-MM-DD): ");
        LocalDate date = LocalDate.parse(scanner.nextLine());

        System.out.print("Source (Handshake, Referral, Direct, etc.): ");
        String source = scanner.nextLine();

        System.out.print("Deadline (YYYY-MM-DD or blank): ");
        String deadlineInput = scanner.nextLine();

        // Deadline is optional
        LocalDate deadline = deadlineInput.isBlank()
                ? null : LocalDate.parse(deadlineInput);

        // Save the application in the tracker
        Application application = tracker.createApplication(
                employer, role, date, source, deadline
        );

        System.out.println("Application created successfully.");
        System.out.println("Application ID: " + application.getId());
    }

    // Displays the three application tracker sections
    private static void viewApplications() {

        printSection("PLAN TO APPLY", tracker.getPlannedApplications());
        printSection("IN PROGRESS", tracker.getInProgressApplications());
        printSection("APPLIED", tracker.getAppliedApplications());
    }

    // Reusable method for displaying application lists
    private static void printSection(
            String heading, List<Application> applications) {

        System.out.println("\n--- " + heading + " ---");

        if (applications.isEmpty()) {
            System.out.println("No applications.");
        } else {
            for (Application application : applications) {
                System.out.println("ID: " + application.getId());
                System.out.println(application);
            }
        }
    }

    // Allows the user to change an application's status
    private static void updateApplication() {

        System.out.print("Enter application ID: ");
        String id = scanner.nextLine();

        System.out.println("Available statuses:");

        for (ApplicationStatus status : ApplicationStatus.values()) {
            System.out.println("- " + status);
        }

        System.out.print("New status: ");
        String input = scanner.nextLine().trim().toUpperCase();

        // Convert text input into an ApplicationStatus
        ApplicationStatus newStatus =
                ApplicationStatus.valueOf(input);

        tracker.updateStatus(id, newStatus);

        System.out.println("Application status updated.");
    }

    // Allows the user to add or replace application notes
    private static void addNotes() {

        System.out.print("Enter application ID: ");
        String id = scanner.nextLine();

        System.out.print("Enter notes: ");
        String notes = scanner.nextLine();

        tracker.updateNotes(id, notes);

        System.out.println("Notes updated successfully.");
    }
}

