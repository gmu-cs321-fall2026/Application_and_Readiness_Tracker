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

        // custom items can be removed, defaults cannot
        checklist.addCustomItem("Temp item");
        int lastNumber = checklist.getItems().size();
        if (!checklist.removeItem(lastNumber).equals("REMOVED")) {
            throw new AssertionError("Test failed: custom item should be removable.");
        }
        if (!checklist.removeItem(1).equals("NOT_CUSTOM")) {
            throw new AssertionError("Test failed: default item should not be removable.");
        }
        System.out.println("PASS: remove rules work");

        // setting a link works, invalid number is rejected
        if (!checklist.setItemLink(1, "https://linkedin.com/in/me")) {
            throw new AssertionError("Test failed: should set link on valid item.");
        }
        if (checklist.getItems().get(0).getExternalLink() == null) {
            throw new AssertionError("Test failed: link was not stored.");
        }
        if (checklist.setItemLink(999, "x")) {
            throw new AssertionError("Test failed: invalid number should return false.");
        }
        System.out.println("PASS: external link set/validate works");
    }
}