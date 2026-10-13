/** What kind of interview it is (content). */
public enum InterviewType {
    RECRUITER_SCREEN("Recruiter screen"),
    BEHAVIORAL("Behavioral"),
    TECHNICAL("Technical"),
    CASE("Case"),
    PANEL("Panel"),
    FINAL_ROUND("Final round"),
    OTHER("Other");

    private final String label;

    InterviewType(String label) { this.label = label; }

    public String getLabel() { return label; }

    @Override
    public String toString() { return label; }
}
