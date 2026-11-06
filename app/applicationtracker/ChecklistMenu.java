
import java.util.Scanner;

/**
 * You can test this file on its own first with the tiny main() at the bottom.
 */
public class ChecklistMenu {
    private static Checklist checklist = new Checklist();

    /** Runs the checklist sub-menu until the student chooses to go back. */
    public static void show(Scanner scanner) {
        // Checklist checklist = new Checklist();
        boolean running = true;

        while (running) {
            checklist.printItems();
            System.out.println();
            System.out.println("Options:");
            System.out.println("  1. View checklist:");
            System.out.println("  2. Mark an item complete / incomplete");
            System.out.println("  3. Add my own item");
            System.out.println("  4. Remove a custom item");
            System.out.println("  5. Add / edit a link");
            System.out.println("  6. Back to main menu");
            System.out.print("Choose an option: ");

            String choice = scanner.nextLine().trim();

            switch (choice) {
                case "1":
                    checklist.printItems();
                    break;
                case "2":
                    System.out.print("Enter the number of the item to toggle: ");
                    String input = scanner.nextLine().trim();
                    try {
                        int number = Integer.parseInt(input);
                        boolean ok = checklist.toggleItem(number);
                        if (!ok) {
                            System.out.println("That isn't a valid item number.");
                        }
                    } catch (NumberFormatException e) {
                        // user typed something that wasn't a number
                        System.out.println("Please enter a number.");
                    }
                    break;

                case "3":
                    System.out.print("Enter a title for your new item: ");
                    String title = scanner.nextLine().trim();
                    if (title.isEmpty()) {
                        System.out.println("Title can't be empty.");
                    } else {
                        checklist.addCustomItem(title);
                        System.out.println("Added: " + title);
                    }
                    break;
                case "4":
                    System.out.print("Enter the number of the custom item to remove: ");
                    String removeInput = scanner.nextLine().trim();
                    try {
                        int number = Integer.parseInt(removeInput);
                        String result = checklist.removeItem(number);
                        switch (result) {
                            case "REMOVED":
                                System.out.println("Item removed.");
                                break;
                            case "NOT_CUSTOM":
                                System.out.println("That's a default item — you can only remove items you added.");
                                break;
                            default: // "INVALID"
                                System.out.println("That isn't a valid item number.");
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("Please enter a number.");
                    }
                    break;
                case "5":
                    System.out.print("Enter the item number to add a link to: ");
                    String linkNumInput = scanner.nextLine().trim();
                    try {
                        int number = Integer.parseInt(linkNumInput);
                        System.out.print("Enter the link (or leave blank to clear it): ");
                        String link = scanner.nextLine().trim();
                        // blank input clears the link (null); otherwise store what they typed
                        boolean ok = checklist.setItemLink(number, link.isEmpty() ? null : link);
                        if (ok) {
                            System.out.println(link.isEmpty() ? "Link cleared." : "Link saved.");
                        } else {
                            System.out.println("That isn't a valid item number.");
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("Please enter a number.");
                    }
                    break;

                case "6":
                    running = false; // leaves the while loop, returns to Main
                    break;

                default:
                    System.out.println("Unknown option -- please type 1, 2, 3, 4, 5 or 6.");
            }
        }
    }

}