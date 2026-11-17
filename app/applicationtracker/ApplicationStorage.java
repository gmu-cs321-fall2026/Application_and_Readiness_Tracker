
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class ApplicationStorage {
    private static final Path FILE =
        Path.of("data", "applications.tsv");

    public static void save(List<Application> applications)
            throws IOException {

        Files.createDirectories(FILE.getParent());
        List<String> lines = new ArrayList<>();

        for (Application app : applications) {
            lines.add(String.join("\t",
                encode(app.getId()),
                encode(app.getEmployerName()),
                encode(app.getRoleTitle()),
                encode(app.getApplicationDate() == null
                    ? "" : app.getApplicationDate().toString()),
                encode(app.getSource()),
                encode(app.getDeadline() == null
                    ? "" : app.getDeadline().toString()),
                encode(app.getNotes()),
                encode(app.getStatus().name())
            ));
        }

        Path temp = Files.createTempFile(
            FILE.getParent(), "applications-", ".tmp");

        try {
            Files.write(temp, lines, StandardCharsets.UTF_8);

            try {
                Files.move(temp, FILE,
                    StandardCopyOption.REPLACE_EXISTING,
                    StandardCopyOption.ATOMIC_MOVE);
            } catch (java.nio.file.AtomicMoveNotSupportedException ex) {
                Files.move(temp, FILE,
                    StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(temp);
        }
    }

    public static void load(ApplicationTracker tracker)
            throws IOException {

        if (!Files.exists(FILE)) return;

        int lineNumber = 0;

        for (String line :
                Files.readAllLines(FILE, StandardCharsets.UTF_8)) {

            lineNumber++;
            if (line.isBlank()) continue;

            try {
                String[] parts = line.split("\t", -1);

                if (parts.length != 8) {
                    throw new IllegalArgumentException(
                        "Expected eight fields.");
                }

                String id = decode(parts[0]);
                String employer = decode(parts[1]);
                String role = decode(parts[2]);
                LocalDate date = parseDate(decode(parts[3]));
                String source = decode(parts[4]);
                LocalDate deadline = parseDate(decode(parts[5]));
                String notes = decode(parts[6]);

                ApplicationStatus status =
                    ApplicationStatus.valueOf(decode(parts[7]));

                // Accept older saved records, including those that
                // have an application date while still PLANNED.
                Application app = tracker.createApplication(
                    employer, role, date, source, deadline);

                app.restoreIdentity(id);

                // Restoring historical data must not silently
                // delete or rewrite the user's old records.
                app.restoreStatus(status);
                app.setNotes(notes);

            } catch (RuntimeException ex) {
                throw new IOException(
                    "Could not load application at line "
                    + lineNumber + ": " + ex.getMessage(), ex);
            }
        }
    }

    private static LocalDate parseDate(String value) {
        return value == null || value.isBlank()
            ? null : LocalDate.parse(value);
    }

    private static String encode(String value) {
        return Base64.getEncoder().encodeToString(
            value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        return new String(
            Base64.getDecoder().decode(value),
            StandardCharsets.UTF_8);
    }
}
