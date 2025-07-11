export type DatabaseType =
  | 'postgres'
  | 'mysql'
  | 'oracle'
  | 'sqlite'
  | 'mariadb';
type userSessionBranch={
  id: string;
  name: string;
}
export type userSession = {
  id: string;
  name: string;
  lastname: string;
  email: string;
  companyname: string;
  companyId: string;
  branchId: string;
  branches?: userSessionBranch[] | null;
  role: {
    id: string;
    name: string;
    isAgent: boolean;
    isAdmin: boolean;
    isConfigurator: boolean;
    state: boolean;
    permissions: [
      {
        endpoint: string;
        methods: string[];
      },
    ];
  };
};

export type DashboardChartGroupBar = {
  title: string;
  description: string;
  categories: string[];
  series: { name: string; data: number[] }[];
};
