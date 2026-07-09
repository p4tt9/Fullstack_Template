package [[ java_package ]].controller;

import [[ java_package ]].dto.HelloResponse;
import [[ java_package ]].service.HelloService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

	private final HelloService helloService;

	public HelloController(HelloService helloService) {
		this.helloService = helloService;
	}

	@GetMapping("/api/hello")
	public HelloResponse hello() {
		return helloService.getHello();
	}
}
