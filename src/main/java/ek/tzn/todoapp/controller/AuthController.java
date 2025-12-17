package ek.tzn.todoapp.controller;

import ek.tzn.todoapp.dto.request.LoginRequest;
import ek.tzn.todoapp.dto.response.LoginResponse;
import ek.tzn.todoapp.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
