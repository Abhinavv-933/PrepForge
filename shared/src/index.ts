import { z } from 'zod';

const requirementKindSchema = z.enum(['technical', 'behavioural', 'domain']);
const requirementPrioritySchema = z.enum(['must', 'nice']);

const questionCategorySchema = z.enum(['technical', 'behavioural', 'system-design', 'company-fit']);

const provenanceSchema = z
  .object({
    origin: z.enum(['generated', 'user']),
    edited: z.boolean(),
    pinned: z.boolean(),
  })
  .optional();

const requirementSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  kind: requirementKindSchema,
  priority: requirementPrioritySchema,
});

const questionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string().min(1)),
  category: questionCategorySchema,
  prompt: z.string(),
  answer_outline: z.string(),
  difficulty: z.number().int().min(1).max(3),
  provenance: provenanceSchema,
});

const flashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string(),
  back: z.string(),
  requirement_ids: z.array(z.string().min(1)),
  provenance: provenanceSchema,
});

const scheduleDaySchema = z.object({
  day: z.number().int().positive(),
  focus: z.string(),
  question_ids: z.array(z.string().min(1)),
  minutes: z.number().int().nonnegative(),
});

const sourceSchema = z.object({
  company: z.string(),
  company_url: z.string(),
  role: z.string(),
  location: z.string(),
  jd_chars: z.number().int().nonnegative(),
  researched_at: z.string(),
  pages_used: z.array(z.string()),
  notes: z.array(z.string()).optional(),
});

const companyBriefSchema = z.object({
  summary: z.string(),
  what_they_do: z.string(),
  sources: z.array(z.string()),
});

const roleSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(requirementSchema),
});

const scheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(scheduleDaySchema),
});

const coverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().nonnegative(),
});

export const kitSchema = z
  .object({
    source: sourceSchema,
    company_brief: companyBriefSchema,
    role: roleSchema,
    questions: z.array(questionSchema),
    flashcards: z.array(flashcardSchema),
    schedule: scheduleSchema,
    coverage: coverageSchema,
  })
  .superRefine((kit, ctx) => {
    const requirementIds = new Set(kit.role.requirements.map((requirement) => requirement.id));

    const questionIds = new Set(kit.questions.map((question) => question.id));

    for (const question of kit.questions) {
      for (const requirementId of question.requirement_ids) {
        if (!requirementIds.has(requirementId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['questions'],
            message: `Question ${question.id} references unknown requirement ${requirementId}`,
          });
        }
      }
    }

    for (const flashcard of kit.flashcards) {
      for (const requirementId of flashcard.requirement_ids) {
        if (!requirementIds.has(requirementId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['flashcards'],
            message: `Flashcard ${flashcard.id} references unknown requirement ${requirementId}`,
          });
        }
      }
    }

    if (kit.schedule.days.length !== kit.schedule.days_available) {
      ctx.addIssue({
        code: 'custom',
        path: ['schedule', 'days'],
        message: 'Schedule days length must equal schedule.days_available',
      });
    }

    for (const day of kit.schedule.days) {
      for (const questionId of day.question_ids) {
        if (!questionIds.has(questionId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['schedule', 'days'],
            message: `Schedule references unknown question ${questionId}`,
          });
        }
      }
    }

    for (const requirementId of kit.coverage.uncovered_requirement_ids) {
      if (!requirementIds.has(requirementId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['coverage', 'uncovered_requirement_ids'],
          message: `Coverage references unknown requirement ${requirementId}`,
        });
      }
    }
  });

export type Kit = z.infer<typeof kitSchema>;
export type Requirement = z.infer<typeof requirementSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Flashcard = z.infer<typeof flashcardSchema>;
export type ScheduleDay = z.infer<typeof scheduleDaySchema>;

export {
  companyBriefSchema,
  coverageSchema,
  flashcardSchema,
  questionSchema,
  requirementSchema,
  roleSchema,
  scheduleDaySchema,
  scheduleSchema,
  sourceSchema,
};
