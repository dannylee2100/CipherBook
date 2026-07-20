export function emptyStudyState() {
  return {
    view: "setup",
    participantCode: "",
    sessionId: "",
    tasks: [],
    taskIndex: 0,
    taskStartedAt: null,
    pendingResponse: null,
    qrComparisonRun: false,
    qrDecoderResult: "",
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
  state.qrComparisonRun = false;
  state.qrDecoderResult = "";
  state.exportReviewVisible = false;
  state.exportConfirmed = false;
}

export function clearStudyState(state) {
  if (!state || typeof state !== "object") {
    return emptyStudyState();
  }
  state.participantCode = "";
  state.sessionId = "";
  state.tasks = [];
  state.taskIndex = 0;
  state.taskStartedAt = null;
  state.pendingResponse = null;
  state.qrComparisonRun = false;
  state.qrDecoderResult = "";
  state.observations = [];
  state.exportReviewVisible = false;
  state.exportConfirmed = false;
  state.status = "No synthetic study session exists.";
  state.error = "";
  state.view = "setup";
  return state;
}
