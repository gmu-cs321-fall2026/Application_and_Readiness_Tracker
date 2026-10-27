
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ApplicationApiServer {

    private static final ApplicationTracker tracker = new ApplicationTracker();
    private static final Path STATIC_ROOT =
            Path.of("app/main/resources/static").toAbsolutePath().normalize();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        server.createContext("/api/applications", ApplicationApiServer::handleApi);
        server.createContext("/", ApplicationApiServer::handleStatic);

        ApplicationStorage.load(tracker);
        server.start();

        System.out.println("Application Tracker running at:");
        System.out.println(
                "http://localhost:8080/applicationtracker/application-tracker.html");
    }

    private static synchronized void handleApi(HttpExchange exchange)
            throws IOException {

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {
            if (path.equals("/api/applications")) {

                if (method.equals("GET")) {
                    send(exchange, 200, listJson(), "application/json");
                    return;
                }

                if (method.equals("POST")) {
                    Map<String, String> data = readForm(exchange);

                    Application app = tracker.createApplication(
                            data.get("employer"),
                            data.get("role"),
                            parseDate(data.get("applicationDate")),
                            data.get("source"),
                            parseDate(data.get("deadline"))
                    );

                    app.setInitialStatus(
                            ApplicationStatus.valueOf(data.get("status"))
                    );
                    tracker.updateNotes(app.getId(), data.get("notes"));

                    ApplicationStorage.save(allApplications());
                    send(exchange, 201, applicationJson(app), "application/json");
                    return;
                }
            }

            if (path.equals("/api/applications/summary")
                    && method.equals("GET")) {
                List<Application> all = allApplications();

                long planned = all.stream()
                        .filter(a -> a.getStatus() == ApplicationStatus.PLANNED
                                || a.getStatus() == ApplicationStatus.IN_PROGRESS)
                        .count();

                long past = all.stream()
                        .filter(a -> a.getStatus() == ApplicationStatus.ACCEPTED
                                || a.getStatus() == ApplicationStatus.REJECTED
                                || a.getStatus() == ApplicationStatus.WITHDRAWN)
                        .count();

                send(exchange, 200,
                        "{\"total\":" + all.size()
                        + ",\"planned\":" + planned
                        + ",\"applied\":" + (all.size() - planned - past)
                        + ",\"past\":" + past + "}",
                        "application/json");
                return;
            }

            String prefix = "/api/applications/";

            if (path.startsWith(prefix) && method.equals("PUT")) {
                String id = path.substring(prefix.length());

                Application app = tracker.findById(id);
                Map<String, String> data = readForm(exchange);

                ApplicationStatus requestedStatus =
                        ApplicationStatus.valueOf(data.get("status"));

                // Validate the status before changing the other fields.
                tracker.updateStatus(id, requestedStatus);

                app.updateDetails(
                        data.get("employer"),
                        data.get("role"),
                        parseDate(data.get("applicationDate")),
                        data.get("source"),
                        parseDate(data.get("deadline"))
                );

                tracker.updateNotes(id, data.get("notes"));

                ApplicationStorage.save(allApplications());
                send(exchange, 200, applicationJson(app), "application/json");
                return;
            }

            send(exchange, 404, "{\"error\":\"Endpoint not found\"}",
                    "application/json");

        } catch (IllegalArgumentException | IllegalStateException ex) {
            int status = ex.getMessage() != null
                    && ex.getMessage().equals("Application not found.")
                    ? 404 : 400;

            send(exchange, status,
                    "{\"error\":" + jsonString(ex.getMessage()) + "}",
                    "application/json");
        }
    }

    private static List<Application> allApplications() {
        List<Application> all = new java.util.ArrayList<>();

        for (ApplicationStatus status : ApplicationStatus.values()) {
            all.addAll(tracker.getApplicationsByStatus(status));
        }

        return all;
    }

    private static String listJson() {
        StringBuilder result = new StringBuilder("[");

        for (Application app : allApplications()) {
            if (result.length() > 1) {
                result.append(",");
            }
            result.append(applicationJson(app));
        }

        return result.append("]").toString();
    }

    private static String applicationJson(Application app) {
        return "{"
                + "\"id\":" + jsonString(app.getId()) + ","
                + "\"employer\":" + jsonString(app.getEmployerName()) + ","
                + "\"role\":" + jsonString(app.getRoleTitle()) + ","
                + "\"applicationDate\":" + jsonString(app.getApplicationDate()) + ","
                + "\"source\":" + jsonString(app.getSource()) + ","
                + "\"deadline\":" + jsonString(app.getDeadline()) + ","
                + "\"notes\":" + jsonString(app.getNotes()) + ","
                + "\"status\":" + jsonString(app.getStatus())
                + "}";
    }

    private static String jsonString(Object value) {
        if (value == null) return "null";

        String text = String.valueOf(value);
        StringBuilder result = new StringBuilder("\"");

        for (char c : text.toCharArray()) {
            switch (c) {
                case '"' -> result.append("\\\"");
                case '\\' -> result.append("\\\\");
                case '\n' -> result.append("\\n");
                case '\r' -> result.append("\\r");
                case '\t' -> result.append("\\t");
                default -> {
                    if (c < 32) {
                        result.append(String.format("\\u%04x", (int) c));
                    } else {
                        result.append(c);
                    }
                }
            }
        }

        return result.append("\"").toString();
    }

    private static LocalDate parseDate(String value) {
        return value == null || value.isBlank()
                ? null : LocalDate.parse(value);
    }

    private static Map<String, String> readForm(HttpExchange exchange)
            throws IOException {

        String body = new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
        );

        Map<String, String> data = new HashMap<>();

        for (String part : body.split("&")) {
            String[] pair = part.split("=", 2);

            String key = URLDecoder.decode(pair[0], StandardCharsets.UTF_8);
            String value = pair.length > 1
                    ? URLDecoder.decode(pair[1], StandardCharsets.UTF_8)
                    : "";

            data.put(key, value);
        }

        return data;
    }

    private static void handleStatic(HttpExchange exchange)
            throws IOException {

        if (!exchange.getRequestMethod().equals("GET")) {
            send(exchange, 405, "Method not allowed", "text/plain");
            return;
        }

        String urlPath = exchange.getRequestURI().getPath();

        if (urlPath.equals("/")) {
            urlPath = "/applicationtracker/application-tracker.html";
        }

        Path file = STATIC_ROOT.resolve(urlPath.substring(1)).normalize();

        if (!file.startsWith(STATIC_ROOT)
                || !Files.isRegularFile(file)) {
            send(exchange, 404, "File not found", "text/plain");
            return;
        }

        String name = file.getFileName().toString();
        String type = name.endsWith(".html") ? "text/html"
                : name.endsWith(".css") ? "text/css"
                : name.endsWith(".js") ? "application/javascript"
                : "application/octet-stream";

        byte[] bytes = Files.readAllBytes(file);

        exchange.getResponseHeaders().set("Content-Type", type);
        exchange.sendResponseHeaders(200, bytes.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private static void send(HttpExchange exchange, int status,
            String body, String contentType) throws IOException {

        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
                "Content-Type", contentType + "; charset=UTF-8");

        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }
}
