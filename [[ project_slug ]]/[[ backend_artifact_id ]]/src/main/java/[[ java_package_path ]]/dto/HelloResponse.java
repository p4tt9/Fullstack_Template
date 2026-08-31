package [[ java_package ]].dto;

import jakarta.validation.constraints.NotNull;

public record HelloResponse(@NotNull String message) {
}
