
import java.util.ArrayList;
import java.util.List;

/**
 * A single student's readiness checklist.
 *
 * It holds the list of items in memory and provides the actions the student
 * needs: view them, mark one done/undone, and add their own custom item.
 *
 */
public class Checklist {

    public List<ChecklistItem> getItems(){
        return items;
    }

    private List<ChecklistItem> items;

    public Checklist() {
        this.items = new ArrayList<>();
        loadDefaultItems();
    }

    /**
     * The default "pre-flight check" template every student starts with.
     * Edit this list to change the defaults.
     */
    private void loadDefaultItems() {
        items.add(new ChecklistItem("Resume drafted", "Documents"));
        items.add(new ChecklistItem("Resume reviewed by Career Services", "Documents"));
        items.add(new ChecklistItem("References identified", "Documents"));
        items.add(new ChecklistItem("LinkedIn profile updated", "Online presence"));
        items.add(new ChecklistItem("Portfolio / GitHub current", "Online presence"));
        items.add(new ChecklistItem("Elevator pitch practiced", "Interview prep"));
        items.add(new ChecklistItem("Mock interview completed", "Interview prep"));
        items.add(new ChecklistItem("Target company list built", "Research"));
    }

    /** Prints the checklist with a number next to each item, plus a progress count. */
    public void printItems() {
        System.out.println();
        System.out.println("=== Readiness Checklist ===");
        int completed = 0;
        for (int i = 0; i < items.size(); i++) {
            // show items numbered starting at 1 (friendlier than starting at 0)
            System.out.println((i + 1) + ". " + items.get(i).toString());
            if (items.get(i).isDone()) {
                completed++;
            }
        }
        System.out.println();
        System.out.println("Progress: " + completed + " of " + items.size() + " complete");
    }

    /**
     * Flips an item between done and not-done, chosen by the number shown in
     * printItems() (so the user types 1 for the first item, not 0).
     * Returns false if the number isn't valid.
     */
    public boolean toggleItem(int displayNumber) {
        int index = displayNumber - 1; // convert back to list index
        if (index < 0 || index >= items.size()) {
            return false;
        }
        ChecklistItem item = items.get(index);
        item.setDone(!item.isDone()); // flip it
        return true;
    }

    /** Lets a student add their own item to the end of the list. */
    public void addCustomItem(String title) {
        items.add(new ChecklistItem(title, "Custom"));
    }
}