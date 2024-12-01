import { app } from "electron";
import { createLogger, transports, format } from "winston";
import { join } from "path";

// Ref: https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/#log-levels-in-winston
export const Logger = createLogger({
  level: "info", // only log entries with a minimum severity of info (or maximum integer priority of 2) will be written while all others are suppressed like warnings, verbose and other
  transports: [
    new transports.File({
      format: format.json(), // log in json format like {"level": level, "message": message }
      filename: "combined.log",
      dirname:
        app.isPackaged === true
          ? join(app.getPath("appData"), "MaxRoom Uploader", "logs")
          : join(process.cwd(), "logs"),
    }), // create a entry of log in file with name logs/combined.log
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== "production") {
  Logger.add(
    new transports.Console({
      format: format.cli(), // print with colors formating in cli
    }),
  );
}
