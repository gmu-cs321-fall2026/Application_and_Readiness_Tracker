/*
 * Terminal menu for recording and viewing interview rounds on an application.
 */

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Scanner;

// Submenu for managing interview rounds
public class InterviewMenu {

    // Expected format when entering an interview date and time
    private static final DateTimeFormatter DATE_TIME_INPUT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // Shows the interview menu until the user goes back
    public static void show(Scanner scanner, ApplicationTracker tracker) {

        boolean running = true;

        while (running) {

            System.out.println("\n=== INTERVIEW ROUNDS ===");
            System.out.println("1. Add Interview Round");
            System.out.println("2. View Interview Rounds");
            System.out.println("3. Add Interview Notes");
            System.out.println("4. Back");
            System.out.print("Choose an option: ");

            String choice = scanner.nextLine().trim();

            try {
                switch (choice) {
                    case "1" -> addRound(scanner, tracker);
                    case "2" -> viewRounds(scanner, tracker);
                    case "3" -> addNotes(scanner, tracker);
                    case "4" -> running = false;
                    default -> System.out.println("Invalid option.");
                }
            } catch (IllegalArgumentException | IllegalStateException e) {
                // Display errors without leaving the menu
                System.out.println("Error: " + e.getMessage());
            }
        }
    }

    // Adds a new interview round to an application
    private static void addRound(Scanner scanner, ApplicationTracker tracker) {

        System.out.print("Enter application ID: ");
        String id = scanner.nextLine().trim();

        // Fail early if the application does not exist
        tracker.findById(id);

        LocalDateTime when = readDateTime(scanner);
        InterviewFormat format = pick(scanner, "Interview format", InterviewFormat.values());
        InterviewType type = pick(scanner, "Interview type", InterviewType.values());

        InterviewRound round = tracker.addInterviewRound(id, when, format, type);

        System.out.println("Interview round added:");
        System.out.println(round);
    }

    // Displays every interview round for an application
    private static void viewRounds(Scanner scanner, ApplicationTracker tracker) {

        System.out.print("Enter application ID: ");
        String id = scanner.nextLine().trim();

        List<InterviewRound> rounds = tracker.getInterviewRounds(id);

        if (rounds.isEmpty()) {
            System.out.println("No interview rounds recorded.");
            return;
        }

        for (InterviewRound round : rounds) {
            System.out.println(round);
        }
    }

    // Adds notes to a specific interview round (e.g., after the interview)
    private static void addNotes(Scanner scanner, ApplicationTracker tracker) {

        System.out.print("Enter application ID: ");
        String id = scanner.nextLine().trim();

        List<InterviewRound> rounds = tracker.getInterviewRounds(id);

        if (rounds.isEmpty()) {
            System.out.println("No interview rounds recorded.");
            return;
        }

        for (InterviewRound round : rounds) {
            System.out.println(round);
        }

        System.out.print("Round number: ");
        int roundNumber = Integer.parseInt(scanner.nextLine().trim());

        System.out.print("Enter notes: ");
        String notes = scanner.nextLine();

        tracker.addInterviewNotes(id, roundNumber, notes);

        System.out.println("Interview notes saved.");
    }

    // Keeps asking until the user enters a valid date and time
    private static LocalDateTime readDateTime(Scanner scanner) {

        while (true) {
            System.out.print("Interview date and time (YYYY-MM-DD HH:mm, 24-hour): ");
            try {
                return LocalDateTime.parse(scanner.nextLine().trim(), DATE_TIME_INPUT);
            } catch (DateTimeParseException e) {
                System.out.println("Invalid format. Example: 2026-11-03 14:30");
            }
        }
    }

    // Shows a numbered menu of enum values and returns the user's choice
    private static <T> T pick(Scanner scanner, String label, T[] options) {

        while (true) {
            System.out.println(label + ":");
            for (int i = 0; i < options.length; i++) {
                System.out.println("  " + (i + 1) + ". " + options[i]);
            }
            System.out.print("Choose: ");

            try {
                int choice = Integer.parseInt(scanner.nextLine().trim());
                if (choice >= 1 && choice <= options.length) {
                    return options[choice - 1];
                }
            } catch (NumberFormatException ignored) {
                // fall through to the error message
            }
            System.out.println("Invalid choice.");
        }
    }
}
