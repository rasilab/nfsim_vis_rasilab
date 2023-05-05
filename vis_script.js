import * as core from './vis_core.js';

// core system initialization, async
let settings = new core.Settings("vis_settings.json");
await settings.parse_settings_file();
let sys = settings.system;

// basic test of system
let ssu = sys.canvas.use(sys.definitions['svgs/ssu.svg']);
let lsu = sys.canvas.use(sys.definitions['svgs/lsu.svg']);
let lsu2 = sys.canvas.use(sys.definitions['svgs/lsu.svg']);
let ssu1 = sys.canvas.use(sys.definitions['svgs/cap.svg']);
let ssu2 = sys.canvas.use(sys.definitions['svgs/termination.svg']);
lsu.move(1000,1000);
ssu1.move(200,200);
ssu2.move(500,500);
lsu2.move(0,2000);

sys.actors.map(x=>x.print_details());