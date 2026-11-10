import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Notes a student writes on the calendar, either on a whole day
 * (key "d:2026-11-10") or on one event (key "e:" plus the event's id).
 * Event notes are kept by the event's id only, so they never copy the
 * interview or application data they belong to.
 */
public class CalendarNotes {
    private static final Pattern KEY = Pattern.compile("[de]:[A-Za-z0-9_.-]{1,120}");
    private static final int MAX_LENGTH = 5000;

    private final Map<String, String> notes = new LinkedHashMap<>();

    // Saves a note; blank text clears it.
    public void put(String key, String text) {
        if (key == null || !KEY.matcher(key).matches()) {
            throw new IllegalArgumentException("Invalid note key.");
        }

        if (text == null || text.isBlank()) {
            notes.remove(key);
            return;
        }

        if (text.length() > MAX_LENGTH) {
            throw new IllegalArgumentException(
                "Notes can be at most " + MAX_LENGTH + " characters.");
        }

        notes.put(key, text);
    }

    public Map<String, String> getAll() {
        return Map.copyOf(notes);
    }
}
