package ek.tzn.todoapp.service;

import ek.tzn.todoapp.repository.SubtaskRepository;
import org.springframework.stereotype.Service;

@Service
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;

    public SubtaskService(SubtaskRepository subtaskRepository) {
        this.subtaskRepository = subtaskRepository;
    }

    // TODO: Implementer metoder
}
