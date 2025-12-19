package ek.tzn.todoapp.service;

import ek.tzn.todoapp.dto.request.UpdateTaskRequest;
import ek.tzn.todoapp.dto.response.TaskResponse;
import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Priority;
import ek.tzn.todoapp.entity.enums.Role;
import ek.tzn.todoapp.entity.enums.Status;
import ek.tzn.todoapp.repository.TaskRepository;
import ek.tzn.todoapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TaskAdminEditTest {

    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private User createAndSaveUser(String username, String name, Role role) {
        User u = new User();
        u.setUsername(username);
        u.setName(name);
        u.setPassword("pw");
        u.setRole(role);
        return userRepository.save(u);
    }

    private Task createAndSaveTask(User assignedTo, Status status) {
        Task t = new Task();
        t.setTitle("Original titel");
        t.setDescription("Original beskrivelse");
        t.setPriority(Priority.MEDIUM);
        t.setDeadline(LocalDate.of(2025, 12, 31));
        t.setStatus(status);
        t.setAssignedTo(assignedTo);
        return taskRepository.save(t);
    }

    @Test
    void admin_can_edit_task() {
        // Arrange
        User admin = createAndSaveUser("admin_edit", "Admin Edit", Role.TEAMLEAD);
        User employee = createAndSaveUser("emp_edit", "Emp Edit", Role.EMPLOYEE);

        Task task = createAndSaveTask(employee, Status.TODO);

        UpdateTaskRequest req = new UpdateTaskRequest();
        req.setTitle("Ny titel");
        req.setDescription("Ny beskrivelse");
        req.setPriority(Priority.HIGH);
        req.setDeadline(LocalDate.of(2026, 1, 15));
        req.setStatus(Status.IN_PROGRESS);

        // Act
        TaskResponse updated = taskService.updateTask(task.getId(), req);

        // Assert (på response)
        assertEquals("Ny titel", updated.title());
        assertEquals("Ny beskrivelse", updated.description());
        assertEquals(Priority.HIGH, updated.priority());
        assertEquals(LocalDate.of(2026, 1, 15), updated.deadline());
        assertEquals(Status.IN_PROGRESS, updated.status());

        // Assert (på database)
        Task fromDb = taskRepository.findById(task.getId()).orElseThrow();
        assertEquals("Ny titel", fromDb.getTitle());
        assertEquals("Ny beskrivelse", fromDb.getDescription());
        assertEquals(Priority.HIGH, fromDb.getPriority());
        assertEquals(LocalDate.of(2026, 1, 15), fromDb.getDeadline());
        assertEquals(Status.IN_PROGRESS, fromDb.getStatus());
    }

    @Test
    void archived_task_cannot_be_updated_via_updateTask() {
        // Arrange
        User admin = createAndSaveUser("admin_arch_1", "Admin Arch 1", Role.TEAMLEAD);
        User employee = createAndSaveUser("emp_arch_1", "Emp Arch 1", Role.EMPLOYEE);

        Task archivedTask = createAndSaveTask(employee, Status.ARCHIVED);

        UpdateTaskRequest req = new UpdateTaskRequest();
        req.setTitle("Forsøg titel");
        req.setDescription("Forsøg beskrivelse");
        req.setPriority(Priority.LOW);
        req.setDeadline(LocalDate.of(2026, 2, 1));
        req.setStatus(Status.DONE);

        // Act + Assert
        assertThrows(IllegalStateException.class, () ->
                taskService.updateTask(archivedTask.getId(), req)
        );
    }

    @Test
    void archived_task_cannot_be_updated_via_updateStatus_even_by_owner() {
        // Arrange
        User employee = createAndSaveUser("emp_arch_2", "Emp Arch 2", Role.EMPLOYEE);
        Task archivedTask = createAndSaveTask(employee, Status.ARCHIVED);

        // Act + Assert (owner prøver at ændre status)
        assertThrows(IllegalStateException.class, () ->
                taskService.updateStatus(archivedTask.getId(), Status.TODO, employee.getId())
        );
    }
}
