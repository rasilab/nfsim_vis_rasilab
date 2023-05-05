import * as core from './vis_core.js';

// core system initialization, async
let settings = new core.Settings("vis_settings.json");
await settings.parse_settings_file();
let sys = settings.system;

// basic test of system
let ssu_inst_1 = sys.add_actor_from_name('ssu');
let ssu_inst_1_grp = ssu_inst_1.render();
ssu_inst_1_grp.move(2000,1000);

let ssu_inst_2 = sys.add_actor_from_name('ssu');
let ssu_inst_2_grp = ssu_inst_2.render();
ssu_inst_2_grp.move(0,2000);

let lsu_inst_1 = sys.add_actor_from_name('lsu');
let lsu_inst_1_grp = lsu_inst_1.render();
lsu_inst_1_grp.move(100,500);