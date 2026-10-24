import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;

public class ApplicationStorage {
    private static final Path FILE = Path.of("data", "applications.tsv");

    public static void save(List<Application> applications) throws IOException {
        Files.createDirectories(FILE.getParent());

        List<String> lines = new ArrayList<>();

        for (Application app : applications) {
            lines.add(String.join("\t",
                encode(app.getId()),
                encode(app.getEmployerName()),
                encode(app.getRoleTitle()),
                encode(app.getApplicationDate().toString()),
                encode(app.getSource()),
                encode(app.getDeadline() == null ? "" : app.getDeadline().toString()),
                encode(app.getNotes()),
                encode(app.getStatus().name())
            ));
        }

        Path temp = FILE.resolveSibling("applications.tmp");
        Files.write(temp, lines);
        Files.move(temp, FILE, StandardCopyOption.REPLACE_EXISTING);
    }

    public static void load(ApplicationTracker tracker) throws IOException {
        if (!Files.exists(FILE)) return;

        for (String line : Files.readAllLines(FILE)) {
            if (line.isBlank()) continue;

            String[] parts = line.split("\t", -1);
            if (parts.length != 8) {
                throw new IOException("Invalid saved application record.");
            }

            String id = decode(parts[0]);
            String employer = decode(parts[1]);
            String role = decode(parts[2]);
            LocalDate date = LocalDate.parse(decode(parts[3]));
            String source = decode(parts[4]);
            String deadlineText = decode(parts[5]);
            String notes = decode(parts[6]);
            ApplicationStatus status =
                ApplicationStatus.valueOf(decode(parts[7]));

            LocalDate deadline = deadlineText.isEmpty()
                ? null : LocalDate.parse(deadlineText);

            Application app = tracker.createApplication(
                employer, role, date, source, deadline
            );

            app.restoreIdentity(id);
            app.setInitialStatus(status);
            app.setNotes(notes);
        }
    }

    private static String encode(String value) {
        return Base64.getEncoder().encodeToString(
            value.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
    }

    private static String decode(String value) {
        return new String(
            Base64.getDecoder().decode(value),
            java.nio.charset.StandardCharsets.UTF_8
        );
    }
}
