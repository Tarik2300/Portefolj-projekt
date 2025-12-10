package ek.tzn.todoapp.repository;

import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Priority;
import ek.tzn.todoapp.entity.enums.Role;
import ek.tzn.todoapp.entity.enums.Status;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class TaskRepositoryTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    // Hjælpemetode til at oprette og gemme en bruger
    private User createAndSaveUser(String username, String name, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setName(name);
        user.setPassword("password123");
        user.setRole(role);
        return userRepository.save(user);
    }

    // Hjælpemetode til at oprette en opgave (gemmes ikke)
    private Task createTask(String title, String description, User assignedTo) {
        Task task = new Task();
        task.setTitle(title);
        task.setDescription(description);
        task.setAssignedTo(assignedTo);
        return task;
    }

    @Test
    void testSaveTask() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen", Role.EMPLOYEE);
        Task task = createTask(
                "Reparation af varmepumpe",
                "Kunde i Valby har problemer med varmepumpen. Kører ikke optimalt og larmer.",
                sofie
        );
        task.setPriority(Priority.HIGH);
        task.setStatus(Status.IN_PROGRESS);
        task.setDeadline(LocalDate.of(2025, 12, 10));

        // Act
        Task saved = taskRepository.save(task);

        // Assert
        assertNotNull(saved.getId());
        assertEquals("Reparation af varmepumpe", saved.getTitle());
        assertEquals(Priority.HIGH, saved.getPriority());
        assertEquals(Status.IN_PROGRESS, saved.getStatus());
        assertEquals(sofie.getId(), saved.getAssignedTo().getId());
    }

    @Test
    void testFindById_TaskExists() {
        // Arrange
        User lars = createAndSaveUser("lars", "Lars Pedersen", Role.EMPLOYEE);
        Task task = createTask(
                "Serviceeftersyn hos Novo",
                "Årligt serviceeftersyn af ventilationsanlæg hos Novo Nordisk.",
                lars
        );
        Task saved = taskRepository.save(task);

        // Act
        Optional<Task> found = taskRepository.findById(saved.getId());

        // Assert
        assertTrue(found.isPresent());
        assertEquals("Serviceeftersyn hos Novo", found.get().getTitle());
    }

    @Test
    void testFindById_TaskNotFound() {
        // Act
        Optional<Task> found = taskRepository.findById(999L);

        // Assert
        assertTrue(found.isEmpty());
    }

    @Test
    void testFindAll() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen", Role.EMPLOYEE);
        taskRepository.save(createTask("Reparation af varmepumpe", "Beskrivelse 1", sofie));
        taskRepository.save(createTask("Akut: Vandskade hos Mærsk", "Beskrivelse 2", sofie));
        taskRepository.save(createTask("El-tjek i butik", "Beskrivelse 3", sofie));

        // Act
        List<Task> allTasks = taskRepository.findAll();

        // Assert
        assertEquals(3, allTasks.size());
    }

    @Test
    void testUpdateTask() {
        // Arrange
        User lars = createAndSaveUser("lars", "Lars Pedersen", Role.EMPLOYEE);
        Task task = createTask("Installation af solceller", "Montering af solcellepaneler.", lars);
        task.setStatus(Status.TODO);
        Task saved = taskRepository.save(task);

        // Act - Lars starter på opgaven
        saved.setStatus(Status.IN_PROGRESS);
        saved.setPriority(Priority.HIGH);
        taskRepository.save(saved);

        // Assert
        Task updated = taskRepository.findById(saved.getId()).orElseThrow();
        assertEquals(Status.IN_PROGRESS, updated.getStatus());
        assertEquals(Priority.HIGH, updated.getPriority());
    }

    @Test
    void testDeleteTask() {
        // Arrange
        User emma = createAndSaveUser("emma", "Emma Hansen", Role.EMPLOYEE);
        Task task = createTask("Bestil nye værktøjskasser", "Indkøb af værktøjskasser.", emma);
        Task saved = taskRepository.save(task);
        Long taskId = saved.getId();

        // Act
        taskRepository.deleteById(taskId);

        // Assert
        Optional<Task> deleted = taskRepository.findById(taskId);
        assertTrue(deleted.isEmpty());
    }

    @Test
    void testFindByAssignedToId() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen", Role.EMPLOYEE);
        User lars = createAndSaveUser("lars", "Lars Pedersen", Role.EMPLOYEE);

        taskRepository.save(createTask("Reparation af varmepumpe", "Beskrivelse", sofie));
        taskRepository.save(createTask("Akut: Vandskade hos Mærsk", "Beskrivelse", sofie));
        taskRepository.save(createTask("Serviceeftersyn hos Novo", "Beskrivelse", lars));

        // Act
        List<Task> sofiesTasks = taskRepository.findByAssignedToId(sofie.getId());
        List<Task> larsTasks = taskRepository.findByAssignedToId(lars.getId());

        // Assert
        assertEquals(2, sofiesTasks.size());
        assertEquals(1, larsTasks.size());
    }

    @Test
    void testFindByAssignedToId_NoTasks() {
        // Arrange
        User emma = createAndSaveUser("emma", "Emma Hansen", Role.EMPLOYEE);

        // Act
        List<Task> emmasTasks = taskRepository.findByAssignedToId(emma.getId());

        // Assert
        assertTrue(emmasTasks.isEmpty());
    }

    @Test
    void testFindByAssignedToIdAndStatusNot() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen", Role.EMPLOYEE);

        Task task1 = createTask("Reparation af varmepumpe", "Beskrivelse", sofie);
        task1.setStatus(Status.IN_PROGRESS);

        Task task2 = createTask("El-tjek i butik", "Beskrivelse", sofie);
        task2.setStatus(Status.DONE);

        Task task3 = createTask("Gammel opgave", "Arkiveret", sofie);
        task3.setStatus(Status.ARCHIVED);

        taskRepository.save(task1);
        taskRepository.save(task2);
        taskRepository.save(task3);

        // Act - Hent alle opgaver undtagen arkiverede
        List<Task> activeTasks = taskRepository.findByAssignedToIdAndStatusNot(
                sofie.getId(), Status.ARCHIVED);

        // Assert
        assertEquals(2, activeTasks.size());
        assertTrue(activeTasks.stream().noneMatch(t -> t.getStatus() == Status.ARCHIVED));
    }

    @Test
    void testFindByAssignedToIdAndStatusNot_ExcludesArchived() {
        // Arrange
        User lars = createAndSaveUser("lars", "Lars Pedersen", Role.EMPLOYEE);

        Task activeTask = createTask("Installation af solceller", "Aktiv opgave", lars);
        activeTask.setStatus(Status.IN_PROGRESS);

        Task archivedTask = createTask("Gammel installation", "Arkiveret", lars);
        archivedTask.setStatus(Status.ARCHIVED);

        taskRepository.save(activeTask);
        taskRepository.save(archivedTask);

        // Act
        List<Task> tasks = taskRepository.findByAssignedToIdAndStatusNot(
                lars.getId(), Status.ARCHIVED);

        // Assert
        assertEquals(1, tasks.size());
        assertEquals("Installation af solceller", tasks.get(0).getTitle());
    }

    @Test
    void testPriorityEnum_AllValues() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen", Role.EMPLOYEE);

        Task lowPriority = createTask("Bestil værktøj", "Lav prioritet", sofie);
        lowPriority.setPriority(Priority.LOW);

        Task mediumPriority = createTask("Serviceeftersyn", "Medium prioritet", sofie);
        mediumPriority.setPriority(Priority.MEDIUM);

        Task highPriority = createTask("Akut vandskade", "Høj prioritet", sofie);
        highPriority.setPriority(Priority.HIGH);

        Task savedLow = taskRepository.save(lowPriority);
        Task savedMedium = taskRepository.save(mediumPriority);
        Task savedHigh = taskRepository.save(highPriority);

        // Assert
        assertEquals(Priority.LOW, taskRepository.findById(savedLow.getId()).orElseThrow().getPriority());
        assertEquals(Priority.MEDIUM, taskRepository.findById(savedMedium.getId()).orElseThrow().getPriority());
        assertEquals(Priority.HIGH, taskRepository.findById(savedHigh.getId()).orElseThrow().getPriority());
    }

    @Test
    void testStatusEnum_AllValues() {
        // Arrange
        User lars = createAndSaveUser("lars", "Lars Pedersen", Role.EMPLOYEE);

        Task todo = createTask("Ny opgave", "TODO", lars);
        todo.setStatus(Status.TODO);

        Task inProgress = createTask("Igangværende", "IN_PROGRESS", lars);
        inProgress.setStatus(Status.IN_PROGRESS);

        Task done = createTask("Færdig opgave", "DONE", lars);
        done.setStatus(Status.DONE);

        Task archived = createTask("Arkiveret opgave", "ARCHIVED", lars);
        archived.setStatus(Status.ARCHIVED);

        Task savedTodo = taskRepository.save(todo);
        Task savedInProgress = taskRepository.save(inProgress);
        Task savedDone = taskRepository.save(done);
        Task savedArchived = taskRepository.save(archived);

        // Assert
        assertEquals(Status.TODO, taskRepository.findById(savedTodo.getId()).orElseThrow().getStatus());
        assertEquals(Status.IN_PROGRESS, taskRepository.findById(savedInProgress.getId()).orElseThrow().getStatus());
        assertEquals(Status.DONE, taskRepository.findById(savedDone.getId()).orElseThrow().getStatus());
        assertEquals(Status.ARCHIVED, taskRepository.findById(savedArchived.getId()).orElseThrow().getStatus());
    }

    @Test
    void testDefaultValues() {
        // Arrange
        User mads = createAndSaveUser("mads", "Mads Jensen", Role.TEAMLEAD);
        Task task = new Task();
        task.setTitle("Tilbudsgivning: DSB kontrakt");
        task.setAssignedTo(mads);
        // Sætter IKKE priority eller status - skal bruge defaults

        // Act
        Task saved = taskRepository.save(task);

        // Assert
        Task found = taskRepository.findById(saved.getId()).orElseThrow();
        assertEquals(Priority.MEDIUM, found.getPriority(), "Default priority skal være MEDIUM");
        assertEquals(Status.TODO, found.getStatus(), "Default status skal være TODO");
    }

    @Test
    void testTaskUserRelationship() {
        // Arrange
        User sofie = createAndSaveUser("sofie", "Sofie Nielsen", Role.EMPLOYEE);
        Task task = createTask("Reparation af varmepumpe", "Beskrivelse", sofie);
        Task saved = taskRepository.save(task);

        // Act
        Task found = taskRepository.findById(saved.getId()).orElseThrow();

        // Assert
        assertNotNull(found.getAssignedTo());
        assertEquals(sofie.getId(), found.getAssignedTo().getId());
        assertEquals("sofie", found.getAssignedTo().getUsername());
    }
}
