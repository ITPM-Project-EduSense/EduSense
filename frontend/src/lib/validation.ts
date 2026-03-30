export type FieldErrors = Record<string, string>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValidateFilesOptions = {
  allowedExtensions: string[];
  maxSizeBytes: number;
  maxFiles?: number;
};

export function validateLoginInput(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.email = "Enter a valid email address.";
  }

  const cleanPassword = password.trim();
  if (!cleanPassword) {
    errors.password = "Password is required.";
  } else if (cleanPassword.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export function validateRegisterInput(fullName: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  const cleanName = fullName.trim();
  if (!cleanName) {
    errors.fullName = "Full name is required.";
  } else if (cleanName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  } else if (cleanName.length > 60) {
    errors.fullName = "Full name must be 60 characters or less.";
  } else if (/^\d+$/.test(cleanName)) {
    errors.fullName = "Name cannot contain only numbers.";
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.email = "Enter a valid email address.";
  }

  const cleanPassword = password.trim();
  if (!cleanPassword) {
    errors.password = "Password is required.";
  } else if (cleanPassword.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export type TaskValidationInput = {
  title: string;
  description: string;
  subject: string;
  deadline: string;
};

export function validateTaskInput(input: TaskValidationInput): FieldErrors {
  const errors: FieldErrors = {};

  const title = input.title.trim();
  const subject = input.subject.trim();
  const description = input.description.trim();

  if (!title) {
    errors.title = "Task title is required.";
  } else if (title.length > 200) {
    errors.title = "Task title must be 200 characters or less.";
  }

  if (!subject) {
    errors.subject = "Subject is required.";
  } else if (subject.length > 100) {
    errors.subject = "Subject must be 100 characters or less.";
  }

  if (description.length > 1000) {
    errors.description = "Description must be 1000 characters or less.";
  }

  if (!input.deadline) {
    errors.deadline = "Deadline is required.";
  } else {
    const deadlineDate = new Date(input.deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      errors.deadline = "Deadline is not a valid date/time.";
    } else if (deadlineDate.getTime() <= Date.now()) {
      errors.deadline = "Deadline must be in the future.";
    }
  }

  return errors;
}

export function validateFiles(files: File[], options: ValidateFilesOptions): string[] {
  const errors: string[] = [];
  const allowed = options.allowedExtensions.map((ext) => ext.toLowerCase());

  if (options.maxFiles && files.length > options.maxFiles) {
    errors.push(`You can upload up to ${options.maxFiles} files.`);
  }

  for (const file of files) {
    const lower = file.name.toLowerCase();
    const extensionAllowed = allowed.some((ext) => lower.endsWith(ext));

    if (!extensionAllowed) {
      errors.push(`${file.name}: unsupported file type.`);
    }

    if (file.size > options.maxSizeBytes) {
      errors.push(`${file.name}: file exceeds ${Math.floor(options.maxSizeBytes / (1024 * 1024))}MB.`);
    }
  }

  return errors;
}
