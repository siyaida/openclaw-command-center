import { getSystemPrompt } from "./templates/system-prompt";
import { getToolsContract } from "./templates/tools-contract";
import { getJobsMapping } from "./templates/jobs-mapping";
import { getWebhooks } from "./templates/webhooks";
import { getPromptsLibrary } from "./templates/prompts-library";

export interface WiringPackFile {
  filename: string;
  content: string;
}

export function generateWiringPack(): WiringPackFile[] {
  return [
    {
      filename: "SYSTEM_PROMPT_OPENCLAW_COMMAND_CENTER.md",
      content: getSystemPrompt(),
    },
    {
      filename: "TOOLS_CONTRACT.md",
      content: getToolsContract(),
    },
    {
      filename: "JOBS_AND_TASKS_MAPPING.md",
      content: getJobsMapping(),
    },
    {
      filename: "WEBHOOKS.md",
      content: getWebhooks(),
    },
    {
      filename: "PROMPTS_LIBRARY.md",
      content: getPromptsLibrary(),
    },
  ];
}
