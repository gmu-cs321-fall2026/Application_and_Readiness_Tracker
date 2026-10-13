/** How the interview is conducted (logistics). */
public enum InterviewFormat {
    PHONE("Phone"),
    VIDEO_CALL("Video call"),
    ON_CAMPUS("On campus"),
    ON_SITE("On-site at employer"),
    OTHER("Other");

    private final String label;

    InterviewFormat(String label) { this.label = label; }

    public String getLabel() { return label; }

    @Override
    public String toString() { return label; }
}
