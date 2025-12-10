package ek.tzn.todoapp.service;

import ek.tzn.todoapp.dto.response.TaskResponse;
import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Status;
import ek.tzn.todoapp.exception.UnauthorizedException;
import ek.tzn.todoapp.repository.TaskRepository;
import ek.tzn.todoapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TaskServiceTest {

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Test
    void getTasksForUser_returnsOnlyTasksForThatUser_andExcludesArchived() {
        // arrange
        Long userId = 2L; // Sofie i data.sql

        // act
        List<TaskResponse> tasks = taskService.getTasksForUser(userId);

        // assert
        assertFalse(tasks.isEmpty(), "Der bør være mindst én task for userId=2");

        // alle tasks skal være tildelt userId = 2
        assertTrue(tasks.stream()
                        .allMatch(t -> userId.equals(t.assignedToId())),
                "Alle tasks skal være tildelt den angivne bruger");

        // ingen tasks må være ARCHIVED
        assertTrue(tasks.stream()
                        .noneMatch(t -> t.status() == Status.ARCHIVED),
                "Ingen tasks må være ARCHIVED");
    }

    @Test
    void updateStatus_throwsUnauthorized_whenUserIsNotOwner() {
        // arrange
        Long taskId = 1L;   // I data.sql er task 1 tildelt userId = 2
        Long wrongUserId = 3L;

        // act + assert
        assertThrows(
                UnauthorizedException.class,
                () -> taskService.updateStatus(taskId, Status.DONE, wrongUserId),
                "Forventede UnauthorizedException når forkert bruger forsøger at ændre status"
        );
    }

    @Test
    void archiveTask_throwsUnauthorized_whenUserIsNotOwner() {
        // arrange
        Long taskId = 1L;   // I data.sql er task 1 tildelt userId = 2
        Long wrongUserId = 3L;

        // act + assert
        assertThrows(
                UnauthorizedException.class,
                () -> taskService.archiveTask(taskId, wrongUserId),
                "Forventede UnauthorizedException når forkert bruger forsøger at arkivere opgaven"
        );
    }

    @Test
    void getMyTasks_shouldNotReturnArchivedTasks() {
        // ARRANGE – Opret en ny bruger og 2 tasks (1 aktiv, 1 arkiveret)
        User user = new User();
        user.setUsername("testuser_3_10");
        user.setName("Test Bruger");
        user.setPassword("secret");
        user = userRepository.save(user);

        // aktiv task
        Task activeTask = new Task();
        activeTask.setTitle("Aktiv opgave");
        activeTask.setStatus(Status.TODO);
        activeTask.setAssignedTo(user);
        taskRepository.save(activeTask);

        // arkiveret task
        Task archivedTask = new Task();
        archivedTask.setTitle("Arkiveret opgave");
        archivedTask.setStatus(Status.ARCHIVED);
        archivedTask.setAssignedTo(user);
        taskRepository.save(archivedTask);

        // ACT – kald service-metoden
        List<TaskResponse> tasksForUser = taskService.getTasksForUser(user.getId());

        // ASSERT – kun den aktive må komme retur
        assertEquals(1, tasksForUser.size(), "Kun én opgave bør returneres");
        assertEquals("Aktiv opgave", tasksForUser.get(0).title());
        assertNotEquals(Status.ARCHIVED, tasksForUser.get(0).status());
    }
}
