export type Student = {
  id: string;
  nim: string;
  fullName: string | null;
  isActive: boolean;
  createdAt: Date;
};

export type StudentFormData = {
  nim: string;
  fullName: string;
};
