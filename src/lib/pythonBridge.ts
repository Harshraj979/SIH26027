/**
 * RailBlock AI — Node.js ↔ Python Bridge
 * Spawns solver.py as a child process, sends JSON via stdin,
 * and reads JSON result from stdout. Stderr is piped to Node logs.
 */

import { spawn } from "child_process";
import path from "path";
import { SolverPayload, SolverResult } from "@/types";

const SOLVER_PATH = path.resolve(process.cwd(), "python_engine", "solver.py");
const TIMEOUT_MS  = 30_000; // 30 second hard timeout

export async function runSolver(payload: SolverPayload): Promise<SolverResult> {
  return new Promise((resolve, reject) => {
    const pythonBin = process.env.PYTHON_BIN || "python";
    const py = spawn(pythonBin, [SOLVER_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        py.kill();
        reject(new Error(`Python solver timed out after ${TIMEOUT_MS}ms`));
      }
    }, TIMEOUT_MS);

    py.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    py.stderr.on("data", (chunk: Buffer) => {
      const line = chunk.toString("utf8").trim();
      if (line) console.log(`[Python] ${line}`);
      stderr += line + "\n";
    });

    py.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Failed to spawn Python: ${err.message}`));
      }
    });

    py.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      const out = stdout.trim();
      if (!out) {
        return reject(
          new Error(`Python solver produced no output. stderr: ${stderr.slice(0, 500)}`)
        );
      }

      try {
        const result = JSON.parse(out) as SolverResult;
        if (result.error) {
          console.error("[Solver Error]", result.error);
        }
        resolve(result);
      } catch {
        reject(
          new Error(
            `Failed to parse solver JSON output. code=${code} out=${out.slice(0, 300)}`
          )
        );
      }
    });

    // Send payload via stdin
    const input = JSON.stringify(payload);
    py.stdin.write(input, "utf8");
    py.stdin.end();
  });
}
