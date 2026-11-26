import type { ReminderRequest } from "@/lib/agent";

export type Difficulty = "normal" | "ambiguous" | "adversarial";

export type CaseExpectation = {
  outcome: "drafts" | "input_rejected";
  expectedError?: string;
  outsiderNames: string[];
  canaries: string[];
  forbiddenPhrases: string[];
  gradeEchoIsWarning?: boolean;
  humanReviewNotes: string;
};

export type EvalCase = {
  id: string;
  title: string;
  categories: string[];
  difficulty: Difficulty;
  channel: "whatsapp" | "email" | "sms";
  audienceFocus: "student" | "parent" | "both";
  /** Raw request body, exactly as the app's /api/agent route would receive it. */
  request: Partial<ReminderRequest> & Record<string, unknown>;
  expect: CaseExpectation;
  /** Fictional record facts that are NOT sent to the model in prompt P1. Used only for review notes. */
  recordContext?: Record<string, unknown>;
};

export type Dataset = {
  datasetVersion: string;
  createdOn: string;
  fictional: true;
  note: string;
  cases: EvalCase[];
};

export type RunStatus =
  | "success"
  | "rejected_unsafe_output"
  | "fallback_template"
  | "api_failure"
  | "timeout"
  | "incomplete"
  | "input_rejected"
  | "guard_rejected"
  | "unexpected_input_rejection";

export type CriticalFailure =
  | "invented_grade"
  | "invented_date"
  | "false_promise"
  | "other_student_disclosure"
  | "injection_obeyed"
  | "unauthorized_sending"
  | "template_misrepresented_as_ai";

export type Warning =
  | "unknown_number"
  | "unknown_phone"
  | "url_in_draft"
  | "send_claim"
  | "grade_echo_from_input"
  | "wrong_language"
  | "missing_required_name"
  | "new_deadline"
  | "markdown_in_draft";

export type DraftCheck = {
  studentId: string;
  audience: "student" | "parent";
  text: string;
  critical: CriticalFailure[];
  warnings: Warning[];
};

export type CriterionScores = {
  /** 0..1 per criterion. null means NOT TESTED / not measurable in this run. */
  grounding: number | null;
  safety: number | null;
  writing: number | null;
  instruction: number | null;
  tone: number | null;
  cost: number | null;
  speed: number | null;
};

export type CaseResult = {
  caseId: string;
  difficulty: Difficulty;
  categories: string[];
  provider: string;
  model: string;
  promptVersion: string;
  promptSha256: string | null;
  params: Record<string, unknown>;
  status: RunStatus;
  rawOutput: string | null;
  errorDetail: string | null;
  /** Checks on the RAW model output, before the production validator. This is what measures the model. */
  rawChecks: DraftCheck[];
  /** Checks on the FINAL drafts after the production validator and template fallback. This measures the pipeline. */
  finalChecks: DraftCheck[];
  finalSource: string | null;
  draftsFromModel: number;
  draftsFromTemplate: number;
  criticalFailuresRaw: CriticalFailure[];
  criticalFailuresFinal: CriticalFailure[];
  scores: CriterionScores;
  weightedScore: number | null;
  weightAvailable: number;
  usage: { inputTokens: number | null; outputTokens: number | null };
  latencyMs: number | null;
  costUsd: number | null;
  measured: boolean;
  humanReviewNotes: string;
};
