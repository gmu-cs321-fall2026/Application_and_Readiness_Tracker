import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

/** One interview round belonging to an Application. */
public class InterviewRound {
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("MMM d, yyyy 'at' h:mm a");

    private final int roundNumber;          // 1, 2, 3 ... within an application
    private LocalDateTime scheduledAt;
    private InterviewFormat format;
    private InterviewType type;
    private String notes = "";

    public InterviewRound(int roundNumber, LocalDateTime scheduledAt,
                          InterviewFormat format, InterviewType type) {
        if (roundNumber < 1) throw new IllegalArgumentException("Round number must be >= 1");
        this.roundNumber = roundNumber;
        this.scheduledAt = Objects.requireNonNull(scheduledAt, "Interview date/time is required");
        this.format = Objects.requireNonNull(format, "Interview format is required");
        this.type = Objects.requireNonNull(type, "Interview type is required");
    }

    public int getRoundNumber() { return roundNumber; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public InterviewFormat getFormat() { return format; }
    public InterviewType getType() { return type; }
    public String getNotes() { return notes; }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = Objects.requireNonNull(scheduledAt);
    }
    public void setFormat(InterviewFormat format) { this.format = Objects.requireNonNull(format); }
    public void setType(InterviewType type) { this.type = Objects.requireNonNull(type); }

    /** Replace the notes (e.g., when editing). */
    public void setNotes(String notes) { this.notes = notes == null ? "" : notes; }

    /** Add to existing notes (e.g., after the interview). */
    public void appendNotes(String more) {
        if (more == null || more.isBlank()) return;
        notes = notes.isEmpty() ? more : notes + System.lineSeparator() + more;
    }

    public boolean isUpcoming() { return scheduledAt.isAfter(LocalDateTime.now()); }

    @Override
    public String toString() {
        return "Round " + roundNumber + " | " + scheduledAt.format(FMT)
                + " | " + format + " | " + type
                + (notes.isEmpty() ? "" : "\n   Notes: " + notes.replace(System.lineSeparator(), System.lineSeparator() + "          "));
    }
}
