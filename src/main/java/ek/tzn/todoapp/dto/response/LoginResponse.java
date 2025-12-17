package ek.tzn.todoapp.dto.response;

import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Role;

public record LoginResponse(
    Long userId,
    String name,
    Role role
) {
    public static LoginResponse fromEntity(User user) {
        return new LoginResponse(
            user.getId(),
            user.getName(),
            user.getRole()
        );
    }
}
