public class ChecklistTest {

    public static void main(String[] args) {

        // --- Test 1: new checklist has the default items ---
        Checklist checklist = new Checklist();
        if (checklist.getItems().size() != 8) {
            throw new AssertionError(
                "Test failed: expected 8 default items, got "
                + checklist.getItems().size());
        }
        System.out.println("PASS: default items loaded");

        // --- Test 2: toggling an item marks it complete ---
        checklist.toggleItem(1);
        if (!checklist.getItems().get(0).isDone()) {
            throw new AssertionError(
                "Test failed: item 1 should be complete after toggle.");
        }
        System.out.println("PASS: toggle marks item complete");

        // --- Test 3: toggling twice returns it to incomplete ---
        checklist.toggleItem(1);
        if (checklist.getItems().get(0).isDone()) {
            throw new AssertionError(
                "Test failed: item 1 should be incomplete after second toggle.");
        }
        System.out.println("PASS: toggle twice returns to incomplete");

        // --- Test 4: invalid item numbers are rejected ---
        if (checklist.toggleItem(0) || checklist.toggleItem(999)) {
            throw new AssertionError(
                "Test failed: invalid item numbers should return false.");
        }
        System.out.println("PASS: invalid toggle numbers rejected");

        // --- Test 5: adding a custom item increases the count ---
        int before = checklist.getItems().size();
        checklist.addCustomItem("Write thank-you emails");
        if (checklist.getItems().size() != before + 1) {
            throw new AssertionError(
                "Test failed: custom item was not added.");
        }
        System.out.println("PASS: custom item added");

        System.out.println("\nAll checklist tests passed.");
    }
}