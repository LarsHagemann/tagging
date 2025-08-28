import * as compose from 'docker-compose';

export const setup = async () => {
  await compose.upAll({
    cwd: './devops/test',
  });

  while (true) {
    const ps = await compose.ps({
      cwd: './devops/test',
    });
    const state = ps.data.services.find(s => s.name === "test-db-1")?.state;
    if (state?.includes("healthy")) {
      break;
    }
  }
}

export const teardown = async () => {
  await compose.downAll({
    cwd: './devops/test',
    commandOptions: ['-v'],
  });
}
