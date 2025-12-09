package ek.tzn.todoapp.dto.request;

import ek.tzn.todoapp.entity.enums.Status;

public class StatusUpdateRequest {
    private Status status;

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}
