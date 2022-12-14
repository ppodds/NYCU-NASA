export interface Config {
  secret: string;
  users: [
    {
      username: string;
      password: string;
    },
  ];
}
