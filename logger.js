import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, 'logs');
        this.initializeLogsDirectory();
        this.voiceEnabledAgents = new Set(); // Track which agents have voice enabled
    }

    async initializeLogsDirectory() {
        try {
            await fs.access(this.logsDir);
        } catch {
            await fs.mkdir(this.logsDir);
        }
    }

    setVoiceEnabled(agentId, enabled) {
        if (enabled) {
            this.voiceEnabledAgents.add(agentId);
        } else {
            this.voiceEnabledAgents.delete(agentId);
        }
    }

    isVoiceEnabled(agentId) {
        return this.voiceEnabledAgents.has(agentId);
    }

    async log(type, data) {
        const timestamp = new Date().toISOString();
        const fileName = `${timestamp.split('T')[0]}.log`;
        const filePath = path.join(this.logsDir, fileName);

        // Add voice status to all relevant log entries
        if (data.agentId !== undefined) {
            data.voiceEnabled = this.isVoiceEnabled(data.agentId);
        }

        const logEntry = {
            timestamp,
            type,
            ...data
        };

        try {
            let existingLogs = [];
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                existingLogs = JSON.parse(content);
            } catch (error) {
                // File doesn't exist or is empty
            }

            existingLogs.push(logEntry);
            await fs.writeFile(filePath, JSON.stringify(existingLogs, null, 2));
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }
}

export const logger = new Logger(); 