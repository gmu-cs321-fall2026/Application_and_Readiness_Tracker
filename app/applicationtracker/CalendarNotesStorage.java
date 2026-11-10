import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Saves calendar notes to disk (same Base64 tab-separated format as the
 * other storage classes) so they survive a restart.
 */
public class CalendarNotesStorage {
    private static final Path FILE = Path.of("data", "calendar-notes.tsv");

    public static void save(CalendarNotes notes) throws IOException {
        Files.createDirectories(FILE.getParent());

        List<String> lines = new ArrayList<>();

        for (Map.Entry<String, String> note : notes.getAll().entrySet()) {
            lines.add(encode(note.getKey()) + "\t" + encode(note.getValue()));
        }

        Path temp = FILE.resolveSibling("calendar-notes.tmp");
        Files.write(temp, lines);
        Files.move(temp, FILE, StandardCopyOption.REPLACE_EXISTING);
    }

    public static void load(CalendarNotes notes) throws IOException {
        if (!Files.exists(FILE)) return;

        for (String line : Files.readAllLines(FILE)) {
            if (line.isBlank()) continue;

            String[] parts = line.split("\t", -1);
            if (parts.length != 2) {
                throw new IOException("Invalid saved calendar note.");
            }

            notes.put(decode(parts[0]), decode(parts[1]));
        }
    }

    private static String encode(String value) {
        return Base64.getEncoder().encodeToString(
            value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        return new String(
            Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
    }
}
