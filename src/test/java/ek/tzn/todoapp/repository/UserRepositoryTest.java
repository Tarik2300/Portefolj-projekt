package ek.tzn.todoapp.repository;

import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    // Hjælpemetode til at oprette en bruger
    private User createUser(String username, String name, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setName(name);
        user.setPassword("password123");
        user.setRole(role);
        return user;
    }

    @Test
    void testSaveUser() {
        // Arrange
        User mads = createUser("mads", "Mads Jensen", Role.TEAMLEAD);

        // Act
        User saved = userRepository.save(mads);

        // Assert
        assertNotNull(saved.getId());
        assertEquals("mads", saved.getUsername());
        assertEquals("Mads Jensen", saved.getName());
        assertEquals(Role.TEAMLEAD, saved.getRole());
    }

    @Test
    void testFindById_UserExists() {
        // Arrange
        User sofie = createUser("sofie", "Sofie Nielsen", Role.EMPLOYEE);
        User saved = userRepository.save(sofie);

        // Act
        Optional<User> found = userRepository.findById(saved.getId());

        // Assert
        assertTrue(found.isPresent());
        assertEquals("sofie", found.get().getUsername());
        assertEquals("Sofie Nielsen", found.get().getName());
    }

    @Test
    void testFindById_UserNotFound() {
        // Act
        Optional<User> found = userRepository.findById(999L);

        // Assert
        assertTrue(found.isEmpty());
    }

    @Test
    void testFindAll() {
        // Arrange
        userRepository.save(createUser("mads", "Mads Jensen", Role.TEAMLEAD));
        userRepository.save(createUser("sofie", "Sofie Nielsen", Role.EMPLOYEE));
        userRepository.save(createUser("lars", "Lars Pedersen", Role.EMPLOYEE));
        userRepository.save(createUser("emma", "Emma Hansen", Role.EMPLOYEE));

        // Act
        List<User> allUsers = userRepository.findAll();

        // Assert
        assertEquals(4, allUsers.size());
    }

    @Test
    void testUpdateUser() {
        // Arrange
        User lars = createUser("lars", "Lars Pedersen", Role.EMPLOYEE);
        User saved = userRepository.save(lars);

        // Act - Lars forfremmes til teamleder
        saved.setName("Lars Pedersen (Senior)");
        saved.setRole(Role.TEAMLEAD);
        userRepository.save(saved);

        // Assert
        User updated = userRepository.findById(saved.getId()).orElseThrow();
        assertEquals("Lars Pedersen (Senior)", updated.getName());
        assertEquals(Role.TEAMLEAD, updated.getRole());
    }

    @Test
    void testDeleteUser() {
        // Arrange
        User emma = createUser("emma", "Emma Hansen", Role.EMPLOYEE);
        User saved = userRepository.save(emma);
        Long emmaId = saved.getId();

        // Act
        userRepository.deleteById(emmaId);

        // Assert
        Optional<User> deleted = userRepository.findById(emmaId);
        assertTrue(deleted.isEmpty());
    }

    @Test
    void testRoleEnum_Employee() {
        // Arrange & Act
        User sofie = createUser("sofie", "Sofie Nielsen", Role.EMPLOYEE);
        User saved = userRepository.save(sofie);

        // Assert
        User found = userRepository.findById(saved.getId()).orElseThrow();
        assertEquals(Role.EMPLOYEE, found.getRole());
    }

    @Test
    void testRoleEnum_Teamlead() {
        // Arrange & Act
        User mads = createUser("mads", "Mads Jensen", Role.TEAMLEAD);
        User saved = userRepository.save(mads);

        // Assert
        User found = userRepository.findById(saved.getId()).orElseThrow();
        assertEquals(Role.TEAMLEAD, found.getRole());
    }

    @Test
    void testUsernameUnique_ThrowsException() {
        // Arrange
        User mads1 = createUser("mads", "Mads Jensen", Role.TEAMLEAD);
        userRepository.save(mads1);

        User mads2 = createUser("mads", "Mads Andersen", Role.EMPLOYEE);

        // Act & Assert - kan ikke have to brugere med samme username
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.saveAndFlush(mads2);
        });
    }
}
