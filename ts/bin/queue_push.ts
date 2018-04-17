#!/usr/bin/env node
import { QueueAgent, Queue } from '..'
import { account, region, program } from './base'

(async function main() {
    const queueAgent = new QueueAgent(account, region);
    const queue = queueAgent.queue(program.queue);
    const resp = await queue.push(program.message);
})().catch(console.error)