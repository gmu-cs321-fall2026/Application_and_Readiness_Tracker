
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class ReadinessStorage {

    private static final Path FILE = Path.of("data/readiness.tsv");

    // encode text so tabs and line breaks do not break the file
    private static String encode(String value) {
        if (value == null) {
            return "";
        }

        return Base64.getEncoder().encodeToString(
                value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        return new String(
                Base64.getDecoder().decode(value),
                StandardCharsets.UTF_8);
    }

    // save every task, including completion and external links
    public static void save(Checklist checklist) throws IOException {
        Files.createDirectories(FILE.getParent());

        List<String> lines = new ArrayList<>();

        for (ChecklistItem item : checklist.getItems()) {
            lines.add(
                    encode(item.getTitle()) + "\t"
                    + encode(item.getCategory()) + "\t"
                    + item.isDone() + "\t"
                    + encode(item.getExternalLink())
            );
        }

        Path temporary = FILE.resolveSibling("readiness.tsv.tmp");

        Files.write(temporary, lines, StandardCharsets.UTF_8);

        Files.move(
                temporary,
                FILE,
                StandardCopyOption.REPLACE_EXISTING
        );
    }

    // restore the checklist when the server starts
    public static void load(Checklist checklist) throws IOException {
        if (!Files.exists(FILE)) {
            return;
        }

        List<ChecklistItem> restored = new ArrayList<>();

        for (String line : Files.readAllLines(
                FILE, StandardCharsets.UTF_8)) {

            if (line.isBlank()) {
                continue;
            }

            String[] parts = line.split("\t", -1);

            if (parts.length != 4) {
                throw new IOException("Invalid readiness storage format.");
            }

            try {
                String title = decode(parts[0]);
                String category = decode(parts[1]);

                if (!parts[2].equals("true")
                        && !parts[2].equals("false")) {
                    throw new IOException("Invalid checklist completion value.");
                }

                boolean done = Boolean.parseBoolean(parts[2]);

                String link = parts[3].isEmpty()
                        ? null : decode(parts[3]);

                ChecklistItem item = new ChecklistItem(title, category);
                item.setDone(done);
                item.setExternalLink(link);

                restored.add(item);

            } catch (IllegalArgumentException ex) {
                throw new IOException(
                        "Could not decode readiness storage.", ex);
            }
        }

        // only replace the defaults after successfully reading everything
        checklist.getItems().clear();
        checklist.getItems().addAll(restored);
    }
}
