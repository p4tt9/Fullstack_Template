package [[ java_package ]].controller;

import [[ java_package ]].dto.AuthenticatedUserResponse;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

	@GetMapping("/api/me")
	public AuthenticatedUserResponse me(@AuthenticationPrincipal Jwt jwt) {
		return new AuthenticatedUserResponse(
				jwt.getClaimAsString("preferred_username"),
				jwt.getClaimAsString("name"),
				jwt.getClaimAsString("email"),
				realmRoles(jwt));
	}

	@SuppressWarnings("unchecked")
	private List<String> realmRoles(Jwt jwt) {
		Map<String, Object> realmAccess = jwt.getClaim("realm_access");
		if (realmAccess == null || !(realmAccess.get("roles") instanceof List<?> roles)) {
			return List.of();
		}

		return (List<String>) roles;
	}
}
