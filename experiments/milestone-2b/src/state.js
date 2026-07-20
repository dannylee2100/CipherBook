export function emptyStudyState() {
  return {
    view: "setup",
    participantCode: "",
    sessionId: "",
    studyPlanVersion: "",
    studyArm: "",
    taskSetSeed: "",
    tasks: [],
    taskIndex: 0,
    taskStartedAt: null,
    pendingResponse: null,
    observations: [],
    exportReviewVisible: false,
    exportConfirmed: false,
    status: "No synthetic study session exists.",
    error: "",
  };
}

export function activeTask(state) {
  return state.tasks[state.taskIndex] ?? null;
}

export function resetTaskResponse(state) {
  state.taskStartedAt = null;
  state.pendingResponse = null;
  state.exportReviewVisible = false;
  state.exportConfirmed = false;
}

export function clearStudyState(state) {
  if (!state || typeof state !== "object") {
    return emptyStudyState();
  }
  state.participantCode = "";
  state.sessionId = "";
  state.studyPlanVersion = "";
  state.studyArm = "";
  state.taskSetSeed = "";
  state.tasks = [];
  state.taskIndex = 0;
  state.taskStartedAt = null;
  state.pendingResponse = null;
  state.observations = [];
  state.exportReviewVisible = false;
  state.exportConfirmed = false;
  state.status = "No synthetic study session exists.";
  state.error = "";
  state.view = "setup";
  return state;
}
