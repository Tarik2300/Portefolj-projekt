package ek.tzn.todoapp.dto.response;

import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Role;

public record UserResponse(
    Long id,
    String username,
    String name,
    Role role
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getName(),
            user.getRole()
        );
    }
}
