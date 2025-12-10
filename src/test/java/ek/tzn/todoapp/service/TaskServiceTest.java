package ek.tzn.todoapp.service;

import ek.tzn.todoapp.dto.response.TaskResponse;
import ek.tzn.todoapp.entity.enums.Status;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import ek.tzn.todoapp.exception.UnauthorizedException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TaskServiceTest {

    @Autowired
    private TaskService taskService;

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

}
