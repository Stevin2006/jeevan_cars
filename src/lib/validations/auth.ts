import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;

export const loginSchema = z.object({
  email: z
    .email("Enter a valid email address")
    .max(120)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Enter your password").max(200),
  next: z.string().max(300).optional(),
});

export type LoginValues = z.input<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(200),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one",
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
