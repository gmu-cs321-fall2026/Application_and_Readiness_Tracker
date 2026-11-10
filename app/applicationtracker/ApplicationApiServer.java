
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ApplicationApiServer {

    private static final ApplicationTracker tracker =
            new ApplicationTracker();

    // one shared checklist for the entire application tracker
    private static final Checklist readinessChecklist = new Checklist();

    private static final Path STATIC_ROOT =
            Path.of("app/main/resources/static")
                    .toAbsolutePath()
                    .normalize();

    public static void main(String[] args) throws IOException {

        HttpServer server = HttpServer.create(
                new InetSocketAddress(8080), 0);

        server.createContext(
                "/api/applications",
                ApplicationApiServer::handleApi);

        server.createContext(
                "/api/readiness",
                ApplicationApiServer::handleReadiness);

        server.createContext(
                "/",
                ApplicationApiServer::handleStatic);

        // restore previously saved applications and interviews
        ApplicationStorage.load(tracker);
        InterviewStorage.load(tracker);

        // restore saved checklist progress, tasks, and links
        ReadinessStorage.load(readinessChecklist);

        server.start();

        System.out.println("Application Tracker running at:");
        System.out.println(
                "http://localhost:8080/applicationtracker/application-tracker.html");
    }

    // handle application and interview requests
    private static synchronized void handleApi(HttpExchange exchange)
            throws IOException {

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {

            // retrieve all applications or create a new application
            if (path.equals("/api/applications")) {

                if (method.equals("GET")) {
                    send(exchange, 200, listJson(),
                            "application/json");
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

                    tracker.updateNotes(
                            app.getId(),
                            data.get("notes")
                    );

                    ApplicationStorage.save(allApplications());

                    send(exchange, 201, applicationJson(app),
                            "application/json");
                    return;
                }
            }

            // application counts used by the dashboard
            if (path.equals("/api/applications/summary")
                    && method.equals("GET")) {

                List<Application> all = allApplications();

                long planned = all.stream()
                        .filter(a ->
                                a.getStatus() == ApplicationStatus.PLANNED
                                || a.getStatus()
                                == ApplicationStatus.IN_PROGRESS)
                        .count();

                long past = all.stream()
                        .filter(a ->
                                a.getStatus() == ApplicationStatus.ACCEPTED
                                || a.getStatus()
                                == ApplicationStatus.REJECTED
                                || a.getStatus()
                                == ApplicationStatus.WITHDRAWN)
                        .count();

                send(exchange, 200,
                        "{\"total\":" + all.size()
                        + ",\"planned\":" + planned
                        + ",\"applied\":"
                        + (all.size() - planned - past)
                        + ",\"past\":" + past + "}",
                        "application/json");
                return;
            }

            String prefix = "/api/applications/";

            // interview requests for an individual application
            if (path.startsWith(prefix)
                    && path.contains("/interviews")) {

                String remainder = path.substring(prefix.length());
                String[] parts = remainder.split("/");

                if (parts.length >= 2
                        && !parts[0].isBlank()
                        && parts[1].equals("interviews")) {

                    String applicationId = parts[0];

                    // retrieve interview rounds
                    if (parts.length == 2 && method.equals("GET")) {

                        List<InterviewRound> rounds =
                                tracker.getInterviewRounds(applicationId);

                        send(exchange, 200,
                                interviewsJson(rounds),
                                "application/json");
                        return;
                    }

                    // schedule a new interview round
                    if (parts.length == 2 && method.equals("POST")) {

                        Map<String, String> data = readForm(exchange);

                        InterviewRound round =
                                tracker.addInterviewRound(
                                        applicationId,
                                        LocalDateTime.parse(
                                                data.get("scheduledAt")),
                                        InterviewFormat.valueOf(
                                                data.get("format")),
                                        InterviewType.valueOf(
                                                data.get("type"))
                                );

                        InterviewStorage.save(allApplications());

                        send(exchange, 201,
                                interviewJson(round),
                                "application/json");
                        return;
                    }

                    // add notes to an interview round
                    if (parts.length == 4
                            && parts[3].equals("notes")
                            && method.equals("POST")) {

                        Map<String, String> data = readForm(exchange);

                        int roundNumber =
                                Integer.parseInt(parts[2]);

                        tracker.addInterviewNotes(
                                applicationId,
                                roundNumber,
                                data.get("notes")
                        );

                        InterviewStorage.save(allApplications());

                        send(exchange, 200,
                                "{\"message\":\"Interview notes saved\"}",
                                "application/json");
                        return;
                    }
                }
            }

            // update an existing application
            if (path.startsWith(prefix) && method.equals("PUT")) {

                String id = path.substring(prefix.length());

                Application app = tracker.findById(id);
                Map<String, String> data = readForm(exchange);

                ApplicationStatus requestedStatus =
                        ApplicationStatus.valueOf(
                                data.get("status"));

                tracker.updateStatus(id, requestedStatus);

                app.updateDetails(
                        data.get("employer"),
                        data.get("role"),
                        parseDate(data.get("applicationDate")),
                        data.get("source"),
                        parseDate(data.get("deadline"))
                );

                tracker.updateNotes(
                        id,
                        data.get("notes")
                );

                ApplicationStorage.save(allApplications());

                send(exchange, 200,
                        applicationJson(app),
                        "application/json");
                return;
            }

            send(exchange, 404,
                    "{\"error\":\"Endpoint not found\"}",
                    "application/json");

        } catch (IllegalArgumentException | IllegalStateException
                | NullPointerException ex) {

            int status =
                    "Application not found.".equals(ex.getMessage())
                            ? 404 : 400;

            String message = ex.getMessage() == null
                    ? "Missing or invalid request data."
                    : ex.getMessage();

            send(exchange, status,
                    "{\"error\":" + jsonString(message) + "}",
                    "application/json");
        }
    }

    // handle shared readiness checklist requests
    private static synchronized void handleReadiness(
            HttpExchange exchange) throws IOException {

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {

            // retrieve checklist and current progress
            if (path.equals("/api/readiness")
                    && method.equals("GET")) {

                send(exchange, 200,
                        readinessJson(),
                        "application/json");
                return;
            }

            // checklist changes must use POST
            if (!method.equals("POST")) {

                send(exchange, 405,
                        "{\"error\":\"Method not allowed\"}",
                        "application/json");
                return;
            }

            Map<String, String> data = readForm(exchange);

            switch (path) {

                // toggle completion of one task
                case "/api/readiness/toggle" -> {

                    int number =
                            Integer.parseInt(data.get("number"));

                    if (!readinessChecklist.toggleItem(number)) {
                        throw new IllegalArgumentException(
                                "Invalid checklist item number.");
                    }
                }

                // add a custom task
                case "/api/readiness/items" -> {

                    String title = data.get("title");

                    if (title == null || title.isBlank()) {
                        throw new IllegalArgumentException(
                                "Task title cannot be empty.");
                    }

                    readinessChecklist.addCustomItem(
                            title.trim());
                }

                // remove a custom task
                case "/api/readiness/items/remove" -> {

                    int number =
                            Integer.parseInt(data.get("number"));

                    String result =
                            readinessChecklist.removeItem(number);

                    if (!result.equals("REMOVED")) {

                        throw new IllegalArgumentException(
                                result.equals("NOT_CUSTOM")
                                        ? "Default tasks cannot be removed."
                                        : "Invalid checklist item number.");
                    }
                }

                // rename a custom task
                case "/api/readiness/items/rename" -> {

                    int number =
                            Integer.parseInt(data.get("number"));

                    String result =
                            readinessChecklist.renameItem(
                                    number,
                                    data.get("title"));

                    if (!result.equals("RENAMED")) {

                        throw new IllegalArgumentException(
                                switch (result) {
                                    case "NOT_CUSTOM" ->
                                            "Default tasks cannot be renamed.";

                                    case "EMPTY" ->
                                            "Task title cannot be empty.";

                                    default ->
                                            "Invalid checklist item number.";
                                });
                    }
                }

                // add, edit, or remove a task's external link
                case "/api/readiness/items/link" -> {

                    int number =
                            Integer.parseInt(data.get("number"));

                    String link = data.get("link");

                    if (!readinessChecklist.setItemLink(
                            number,
                            link == null || link.isBlank()
                                    ? null : link.trim())) {

                        throw new IllegalArgumentException(
                                "Invalid checklist item number.");
                    }
                }

                // complete every task
                case "/api/readiness/complete-all" ->
                        readinessChecklist.markAllComplete();

                // reset all task completion statuses
                case "/api/readiness/reset" ->
                        readinessChecklist.resetAll();

                default -> {
                    send(exchange, 404,
                            "{\"error\":\"Endpoint not found\"}",
                            "application/json");
                    return;
                }
            }

            // permanently save after each successful change
            ReadinessStorage.save(readinessChecklist);

            // return updated checklist to refresh the frontend
            send(exchange, 200,
                    readinessJson(),
                    "application/json");

        } catch (IllegalArgumentException | NullPointerException ex) {

            String message = ex.getMessage() == null
                    ? "Missing or invalid checklist data."
                    : ex.getMessage();

            send(exchange, 400,
                    "{\"error\":" + jsonString(message) + "}",
                    "application/json");
        }
    }

    // retrieve all applications from the tracker
    private static List<Application> allApplications() {

        List<Application> all = new ArrayList<>();

        for (ApplicationStatus status : ApplicationStatus.values()) {
            all.addAll(tracker.getApplicationsByStatus(status));
        }

        return all;
    }

    // convert all applications to a JSON array
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

    // convert an application to JSON
    private static String applicationJson(Application app) {

        return "{"
                + "\"id\":" + jsonString(app.getId()) + ","
                + "\"employer\":"
                + jsonString(app.getEmployerName()) + ","
                + "\"role\":"
                + jsonString(app.getRoleTitle()) + ","
                + "\"applicationDate\":"
                + jsonString(app.getApplicationDate()) + ","
                + "\"source\":"
                + jsonString(app.getSource()) + ","
                + "\"deadline\":"
                + jsonString(app.getDeadline()) + ","
                + "\"notes\":"
                + jsonString(app.getNotes()) + ","
                + "\"status\":"
                + jsonString(app.getStatus())
                + "}";
    }

    // convert one interview round to JSON
    private static String interviewJson(InterviewRound round) {

        return "{"
                + "\"roundNumber\":"
                + round.getRoundNumber() + ","
                + "\"scheduledAt\":"
                + jsonString(round.getScheduledAt()) + ","
                + "\"format\":"
                + jsonString(round.getFormat().name()) + ","
                + "\"type\":"
                + jsonString(round.getType().name()) + ","
                + "\"notes\":"
                + jsonString(round.getNotes())
                + "}";
    }

    // convert interview rounds into a JSON array
    private static String interviewsJson(
            List<InterviewRound> rounds) {

        StringBuilder result = new StringBuilder("[");

        for (InterviewRound round : rounds) {

            if (result.length() > 1) {
                result.append(",");
            }

            result.append(interviewJson(round));
        }

        return result.append("]").toString();
    }

    // convert readiness checklist and progress into JSON
    private static String readinessJson() {

        List<ChecklistItem> items =
                readinessChecklist.getItems();

        int completed = 0;

        StringBuilder result =
                new StringBuilder("{\"items\":[");

        for (int i = 0; i < items.size(); i++) {

            ChecklistItem item = items.get(i);

            if (i > 0) {
                result.append(",");
            }

            if (item.isDone()) {
                completed++;
            }

            result.append("{")
                    .append("\"number\":")
                    .append(i + 1)
                    .append(",")
                    .append("\"title\":")
                    .append(jsonString(item.getTitle()))
                    .append(",")
                    .append("\"category\":")
                    .append(jsonString(item.getCategory()))
                    .append(",")
                    .append("\"done\":")
                    .append(item.isDone())
                    .append(",")
                    .append("\"externalLink\":")
                    .append(jsonString(item.getExternalLink()))
                    .append("}");
        }

        return result
                .append("],\"completed\":")
                .append(completed)
                .append(",\"total\":")
                .append(items.size())
                .append("}")
                .toString();
    }

    // escape special characters for valid JSON
    private static String jsonString(Object value) {

        if (value == null) {
            return "null";
        }

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
                        result.append(
                                String.format("\\u%04x", (int) c));
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
                ? null
                : LocalDate.parse(value);
    }

    // read form data submitted by the frontend
    private static Map<String, String> readForm(
            HttpExchange exchange) throws IOException {

        String body = new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
        );

        Map<String, String> data = new HashMap<>();

        for (String part : body.split("&")) {

            String[] pair = part.split("=", 2);

            String key = URLDecoder.decode(
                    pair[0],
                    StandardCharsets.UTF_8);

            String value = pair.length > 1
                    ? URLDecoder.decode(
                            pair[1],
                            StandardCharsets.UTF_8)
                    : "";

            data.put(key, value);
        }

        return data;
    }

    // serve frontend files for all three views
    private static void handleStatic(
            HttpExchange exchange) throws IOException {

        if (!exchange.getRequestMethod().equals("GET")) {

            send(exchange, 405,
                    "Method not allowed",
                    "text/plain");
            return;
        }

        String urlPath =
                exchange.getRequestURI().getPath();

        if (urlPath.equals("/")) {
            urlPath =
                    "/applicationtracker/application-tracker.html";
        }

        Path file = STATIC_ROOT
                .resolve(urlPath.substring(1))
                .normalize();

        if (!file.startsWith(STATIC_ROOT)
                || !Files.isRegularFile(file)) {

            send(exchange, 404,
                    "File not found",
                    "text/plain");
            return;
        }

        String name = file.getFileName().toString();

        String type = name.endsWith(".html")
                ? "text/html"
                : name.endsWith(".css")
                ? "text/css"
                : name.endsWith(".js")
                ? "application/javascript"
                : "application/octet-stream";

        byte[] bytes = Files.readAllBytes(file);

        exchange.getResponseHeaders().set(
                "Content-Type", type);

        exchange.sendResponseHeaders(200, bytes.length);

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(bytes);
        }
    }

    // send an HTTP response
    private static void send(
            HttpExchange exchange,
            int status,
            String body,
            String contentType) throws IOException {

        byte[] bytes =
                body.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
                "Content-Type",
                contentType + "; charset=UTF-8");

        exchange.sendResponseHeaders(
                status,
                bytes.length);

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(bytes);
        }
    }
}
