package [[ java_package ]].service;

import [[ java_package ]].dto.HelloResponse;
import org.springframework.stereotype.Service;

@Service
public class HelloService {

	public HelloResponse getHello() {
		return new HelloResponse("Hello World");
	}
}
