
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class InterviewStorage {

    private static final Path FILE = Path.of("data", "interviews.tsv");

    // save all interview rounds with their application IDs
    public static void save(List<Application> applications) throws IOException {
        Files.createDirectories(FILE.getParent());

        List<String> lines = new ArrayList<>();

        for (Application app : applications) {
            for (InterviewRound round : app.getInterviewRounds()) {
                lines.add(String.join("\t",
                        encode(app.getId()),
                        encode(String.valueOf(round.getRoundNumber())),
                        encode(round.getScheduledAt().toString()),
                        encode(round.getFormat().name()),
                        encode(round.getType().name()),
                        encode(round.getNotes())
                ));
            }
        }

        Path temp = FILE.resolveSibling("interviews.tmp");
        Files.write(temp, lines, StandardCharsets.UTF_8);
        Files.move(temp, FILE, StandardCopyOption.REPLACE_EXISTING);
    }

    // load interviews after applications have been restored
    public static void load(ApplicationTracker tracker) throws IOException {
        if (!Files.exists(FILE)) {
            return;
        }

        int lineNumber = 0;

        for (String line : Files.readAllLines(FILE, StandardCharsets.UTF_8)) {
            lineNumber++;

            if (line.isBlank()) {
                continue;
            }

            String[] parts = line.split("\t", -1);

            if (parts.length != 6) {
                throw new IOException(
                        "Invalid interview record at line " + lineNumber);
            }

            try {
                String applicationId = decode(parts[0]);
                int roundNumber = Integer.parseInt(decode(parts[1]));
                LocalDateTime scheduledAt =
                        LocalDateTime.parse(decode(parts[2]));
                InterviewFormat format =
                        InterviewFormat.valueOf(decode(parts[3]));
                InterviewType type =
                        InterviewType.valueOf(decode(parts[4]));
                String notes = decode(parts[5]);

                Application app = tracker.findById(applicationId);

                // restore through Application rather than the tracker
                // because tracker.addInterviewRound requires INTERVIEW status
                InterviewRound round =
                        app.addInterviewRound(scheduledAt, format, type);

                if (round.getRoundNumber() != roundNumber) {
                    throw new IllegalArgumentException(
                            "Interview round numbers are out of order.");
                }

                round.setNotes(notes);

            } catch (IllegalArgumentException | IllegalStateException ex) {
                throw new IOException(
                        "Could not load interview at line " + lineNumber,
                        ex);
            }
        }
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
