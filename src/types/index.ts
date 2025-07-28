export interface DepartmentData {
  Name: string;
  Status: 'On Track' | 'At Risk' | 'Delayed';
  LastUpdate: string;
  UpdateNote: string;
}

export interface DashboardData {
  data: DepartmentData[];
}