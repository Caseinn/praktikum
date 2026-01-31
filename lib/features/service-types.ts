export type ServiceResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};
