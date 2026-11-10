import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Endpoints that only the Calendar View needs. Interviews and the readiness
 * checklist already have their own endpoints, so the calendar reads those
 * directly; this class only adds saved calendar notes.
 *
 *   GET /api/calendar/notes   all calendar notes as { key: text }
 *   PUT /api/calendar/notes   save or clear one note (key, text)
 */
public class CalendarApi {
    private static final CalendarNotes notes = new CalendarNotes();

    public static void register(HttpServer server) throws IOException {
        server.createContext("/api/calendar", CalendarApi::handle);
        CalendarNotesStorage.load(notes);
    }

    private static synchronized void handle(HttpExchange exchange)
            throws IOException {

        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        try {
            if (path.equals("/api/calendar/notes")) {
                if (method.equals("GET")) {
                    send(exchange, 200, notesJson());
                    return;
                }

                if (method.equals("PUT")) {
                    Map<String, String> data = readForm(exchange);

                    notes.put(data.get("key"), data.get("text"));
                    CalendarNotesStorage.save(notes);
                    send(exchange, 200, "{\"saved\":true}");
                    return;
                }
            }

            send(exchange, 404, "{\"error\":\"Endpoint not found\"}");

        } catch (IllegalArgumentException ex) {
            send(exchange, 400,
                    "{\"error\":" + jsonString(ex.getMessage()) + "}");
        } catch (IOException ex) {
            send(exchange, 500, "{\"error\":\"Could not save notes.\"}");
        }
    }

    private static String notesJson() {
        List<String> items = new ArrayList<>();

        for (Map.Entry<String, String> note : notes.getAll().entrySet()) {
            items.add(jsonString(note.getKey()) + ":"
                    + jsonString(note.getValue()));
        }

        return "{" + String.join(",", items) + "}";
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

    private static void send(HttpExchange exchange, int status, String body)
            throws IOException {

        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }
}
