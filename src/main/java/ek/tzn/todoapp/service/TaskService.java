package ek.tzn.todoapp.service;

import ek.tzn.todoapp.repository.TaskRepository;
import org.springframework.stereotype.Service;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    // TODO: Implementer metoder
}
