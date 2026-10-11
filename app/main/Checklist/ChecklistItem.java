/**
 * One item on a student's readiness checklist.
 *
 * It only tracks status (done or not) and an optional link -- no file upload or
 * document storage, matching the feature description.
 */
public class ChecklistItem {

    private String title;        // e.g. "Resume drafted"
    private String category;     // e.g. "Documents" (optional grouping)
    private boolean done;        // has the student completed this?
    private String externalLink; // optional link (e.g. to their LinkedIn); may be null

    // Constructor used for the default template items (not done yet, no link).
    public ChecklistItem(String title, String category) {
        this.title = title;
        this.category = category;
        this.done = false;
        this.externalLink = null;
    }

    // --- getters and setters ---
    public String getTitle() {
        return title;
    }

    public String getCategory() {
        return category;
    }

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public String getExternalLink() {
        return externalLink;
    }

    public void setExternalLink(String externalLink) {
        this.externalLink = externalLink;
    }

    /**
     * Builds a readable line for the console, e.g.:
     *   [x] Resume drafted (Documents)
     *   [ ] LinkedIn profile updated (Online presence) -> https://linkedin.com/in/me
     */
    @Override
    public String toString() {
        String checkbox = done ? "[x]" : "[ ]";
        String line = checkbox + " " + title;
        if (category != null) {
            line += " (" + category + ")";
        }
        if (externalLink != null) {
            line += " -> " + externalLink;
        }
        return line;
    }
}