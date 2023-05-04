import * as core from './vis_core.js';

// core system initialization, async
let settings = new core.Settings("vis_settings.json");
await settings.parse_settings_file();
let sys = settings.system;

// basic test of system
let ssu = sys.canvas.use(sys.definitions['ssu']);
let lsu = sys.canvas.use(sys.definitions['lsu']);
lsu.move(1000,1000);