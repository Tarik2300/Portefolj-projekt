package ek.tzn.todoapp.repository;

import ek.tzn.todoapp.entity.Subtask;
import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class SubtaskRepositoryTest {

    @Autowired
    private SubtaskRepository subtaskRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    // Hjælpemetode til at oprette og gemme en bruger
    private User createAndSaveUser(String username, String name) {
        User user = new User();
        user.setUsername(username);
        user.setName(name);
        user.setPassword("password123");
        user.setRole(Role.EMPLOYEE);
        return userRepository.save(user);
    }

    // Hjælpemetode til at oprette og gemme en opgave
    private Task createAndSaveTask(String title, User assignedTo) {
        Task task = new Task();
        task.setTitle(title);
        task.setDescription("Beskrivelse for " + title);
        task.setAssignedTo(assignedTo);
        return taskRepository.save(task);
    }

    // Hjælpemetode til at oprette en subtask (gemmes ikke)
    private Subtask createSubtask(String description, Task task) {
        Subtask subtask = new Subtask();
        subtask.setDescription(description);
        subtask.setTask(task);
        return subtask;
    }

    @Test
    void testSaveSubtask() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen");
        Task varmepumpe = createAndSaveTask("Reparation af varmepumpe", sofie);
        Subtask subtask = createSubtask("Tjek kompressor", varmepumpe);

        // Act
        Subtask saved = subtaskRepository.save(subtask);

        // Assert
        assertNotNull(saved.getId());
        assertEquals("Tjek kompressor", saved.getDescription());
        assertEquals(varmepumpe.getId(), saved.getTask().getId());
    }

    @Test
    void testFindById_SubtaskExists() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen");
        Task varmepumpe = createAndSaveTask("Reparation af varmepumpe", sofie);
        Subtask subtask = createSubtask("Rens filtre", varmepumpe);
        Subtask saved = subtaskRepository.save(subtask);

        // Act
        Optional<Subtask> found = subtaskRepository.findById(saved.getId());

        // Assert
        assertTrue(found.isPresent());
        assertEquals("Rens filtre", found.get().getDescription());
    }

    @Test
    void testFindById_SubtaskNotFound() {
        // Act
        Optional<Subtask> found = subtaskRepository.findById(999L);

        // Assert
        assertTrue(found.isEmpty());
    }

    @Test
    void testFindAll() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen");
        Task varmepumpe = createAndSaveTask("Reparation af varmepumpe", sofie);

        subtaskRepository.save(createSubtask("Tjek kompressor", varmepumpe));
        subtaskRepository.save(createSubtask("Rens filtre", varmepumpe));
        subtaskRepository.save(createSubtask("Bestil reservedel", varmepumpe));

        // Act
        List<Subtask> allSubtasks = subtaskRepository.findAll();

        // Assert
        assertEquals(3, allSubtasks.size());
    }

    @Test
    void testUpdateSubtask() {
        // Arrange
        User lars = createAndSaveUser("lars", "Lars Pedersen");
        Task serviceeftersyn = createAndSaveTask("Serviceeftersyn hos Novo", lars);
        Subtask subtask = createSubtask("Hent nøgler i reception", serviceeftersyn);
        Subtask saved = subtaskRepository.save(subtask);

        // Act - Lars har hentet nøglerne
        saved.setCompleted(true);
        subtaskRepository.save(saved);

        // Assert
        Subtask updated = subtaskRepository.findById(saved.getId()).orElseThrow();
        assertTrue(updated.isCompleted());
    }

    @Test
    void testDeleteSubtask() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen");
        Task vandskade = createAndSaveTask("Akut: Vandskade hos Mærsk", sofie);
        Subtask subtask = createSubtask("Ring til kunde", vandskade);
        Subtask saved = subtaskRepository.save(subtask);
        Long subtaskId = saved.getId();

        // Act
        subtaskRepository.deleteById(subtaskId);

        // Assert
        Optional<Subtask> deleted = subtaskRepository.findById(subtaskId);
        assertTrue(deleted.isEmpty());
    }

    @Test
    void testDefaultCompletedFalse() {
        // Arrange
        User lars = createAndSaveUser("lars", "Lars Pedersen");
        Task solceller = createAndSaveTask("Installation af solceller", lars);
        Subtask subtask = new Subtask();
        subtask.setDescription("Monter beslag på tag");
        subtask.setTask(solceller);
        // Sætter IKKE completed - skal default til false

        // Act
        Subtask saved = subtaskRepository.save(subtask);

        // Assert
        Subtask found = subtaskRepository.findById(saved.getId()).orElseThrow();
        assertFalse(found.isCompleted(), "Default completed skal være false");
    }

    @Test
    void testSubtaskTaskRelationship() {
        // Arrange
        User mads = createAndSaveUser("mads", "Mads Jensen");
        Task dsbTilbud = createAndSaveTask("Tilbudsgivning: DSB kontrakt", mads);
        Subtask subtask = createSubtask("Beregn timepris", dsbTilbud);
        Subtask saved = subtaskRepository.save(subtask);

        // Act
        Subtask found = subtaskRepository.findById(saved.getId()).orElseThrow();

        // Assert
        assertNotNull(found.getTask());
        assertEquals(dsbTilbud.getId(), found.getTask().getId());
        assertEquals("Tilbudsgivning: DSB kontrakt", found.getTask().getTitle());
    }

    // NOTE: Cascade delete test er udeladt da det kræver TestEntityManager
    // og er mere en integration test af JPA konfiguration.
    // Cascade er konfigureret i Task entity med: @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
}
