package ek.tzn.todoapp.controller;

import ek.tzn.todoapp.dto.request.CreateSubtaskRequest;
import ek.tzn.todoapp.dto.response.SubtaskResponse;
import ek.tzn.todoapp.repository.SubtaskRepository;
import ek.tzn.todoapp.repository.TaskRepository;
import ek.tzn.todoapp.service.SubtaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class SubtaskController {

    private final SubtaskService subtaskService;

    public SubtaskController(SubtaskService subtaskService) {
        this.subtaskService = subtaskService;
    }

    @PostMapping("/tasks/{taskId}/subtasks")
    public SubtaskResponse createSubtask(
            @PathVariable Long taskId,
            @RequestParam Long userId,
            @RequestBody CreateSubtaskRequest request) {
        return subtaskService.createSubtask(taskId, request, userId);
    }

    @PatchMapping("/subtasks/{id}/status")
    public SubtaskResponse updateStatus(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam boolean completed) {
        return subtaskService.updateStatus(id, completed, userId);
    }

    @DeleteMapping("/subtasks/{id}")
    public ResponseEntity<Void> deleteSubtask(
            @PathVariable Long id,
            @RequestParam Long userId) {
        subtaskService.deleteSubtask(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/{taskId}/subtasks")
    public java.util.List<SubtaskResponse> getSubtasksForTask(
            @PathVariable Long taskId,
            @RequestParam Long userId) {
        return subtaskService.getSubtasksForTask(taskId, userId);
    }

}
