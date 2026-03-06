import pretty from 'pino-pretty';

const stream = pretty({
  colorize: true,
  singleLine: false,
  translateTime: 'SYS:standard',
  destination: process.stdout
});

export default function () {
  return {
    write(chunk: string) {
      try {
        const log = JSON.parse(chunk);
        if (log.level === 10 || log.level === 20) {
          stream.write(chunk);
        }
      } catch (error) {
        stream.write(chunk);
      }
    },
  };
}
