import 'source-map-support/register';

import { logger } from '@runejs/common';
import { ready } from '@utilities/convert-npcs/load';
import { loadConvertWriteNpcs } from './convert-npcs/convert';

const shutdownEvents = [
    'SIGHUP',  'SIGINT',  'SIGQUIT',
    'SIGILL',  'SIGTRAP', 'SIGABRT',
    'SIGBUS',  'SIGFPE',  'SIGUSR1',
    'SIGSEGV', 'SIGUSR2', 'SIGTERM'
];

let running: boolean = true;
let type: 'convert-npcs' | 'test' = 'convert-npcs';

if(process.argv.indexOf('-convert-npcs') !== -1) {
    type = 'convert-npcs';
} else if(process.argv.indexOf('-test') !== -1) {
    type = 'test';
}

shutdownEvents.forEach(signal => process.on(signal as any, () => {
    if(!running) {
        return;
    }
    running = false;

    logger.warn(`${signal} received.`);

    // Perform any specific logic here
    // if(type === 'game') {
    //     activeWorld?.shutdown();
    // }

    logger.info(`${type.charAt(0).toUpperCase()}${type.substring(1)} utilities shutting down...`);
    process.exit(0);
}));


switch (type) {
    case 'test':
        ready();
        break;
    case 'convert-npcs':
        loadConvertWriteNpcs();
        break;
    default:
        break;
}
