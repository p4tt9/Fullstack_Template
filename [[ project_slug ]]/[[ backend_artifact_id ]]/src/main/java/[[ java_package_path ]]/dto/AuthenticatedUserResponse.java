package [[ java_package ]].dto;

import java.util.List;

public record AuthenticatedUserResponse(
		String username,
		String name,
		String email,
		List<String> roles) {
}
