import { Schema, model, type InferSchemaType } from 'mongoose';

const kitSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    inputHash: {
      type: String,
      required: true,
    },

    input: {
      jd: {
        type: String,
        required: true,
      },

      companyUrl: {
        type: String,
        required: true,
      },

      days: {
        type: Number,
        required: true,
        min: 1,
      },
    },

    kit: {
      type: Schema.Types.Mixed,
      default: null,
    },

    generation: {
      status: {
        type: String,
        enum: ['queued', 'running', 'done', 'failed'],
        required: true,
        default: 'queued',
      },

      step: {
        type: String,
        default: null,
      },

      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      error: {
        code: {
          type: String,
          default: null,
        },

        message: {
          type: String,
          default: null,
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

kitSchema.index(
  {
    userId: 1,
    inputHash: 1,
  },
  {
    unique: true,
  },
);

export type KitDocument = InferSchemaType<typeof kitSchema>;

export const KitModel = model<KitDocument>('Kit', kitSchema);
