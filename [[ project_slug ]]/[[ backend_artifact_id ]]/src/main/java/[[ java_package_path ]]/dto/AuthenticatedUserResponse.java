package [[ java_package ]].dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AuthenticatedUserResponse(
		@NotNull String username,
		@NotNull String name,
		@NotNull String email,
		@NotNull List<String> roles) {
}
