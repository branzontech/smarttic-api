export type DatabaseType =
  | 'postgres'
  | 'mysql'
  | 'oracle'
  | 'sqlite'
  | 'mariadb';

export type userSession = {
  id: string;
  name: string;
  lastname: string;
  email: string;
  branchId: string;
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
