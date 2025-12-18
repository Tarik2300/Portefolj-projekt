package ek.tzn.todoapp.service;

import ek.tzn.todoapp.dto.request.LoginRequest;
import ek.tzn.todoapp.dto.response.LoginResponse;
import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.exception.UnauthorizedException;
import ek.tzn.todoapp.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UnauthorizedException("Ugyldigt brugernavn eller adgangskode"));

        if (!request.getPassword().equals(user.getPassword())) {
            throw new UnauthorizedException("Ugyldigt brugernavn eller adgangskode");
        }

        return LoginResponse.fromEntity(user);
    }
}
