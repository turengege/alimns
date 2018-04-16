import { account, region, program } from './base'
import { TopicAgent } from '../topic';

(async function main() {
    const topicAgent = new TopicAgent(account, region);
    const topic = topicAgent.topic(program.topic);
    const resp = await topic.publish(program.message);
    console.log(resp);
})().catch(console.error)