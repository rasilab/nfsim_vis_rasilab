import * as core from './vis_core.js';

// core system initialization, async
let settings = new core.Settings("vis_settings.json");
await settings.parse_settings_file();
let sys = settings.system;

// basic test of system
let ssu_template = sys.actors['ssu'];
let ssu_inst_1_list = ssu_template.render();
ssu_inst_1_list.map(x=>x.move(2000,1000));
let ssu_inst_2_list = ssu_template.render();
ssu_inst_2_list.map(x=>x.move(0,2000));

let lsu_template = sys.actors['lsu'];
let lsu_inst_1_list = lsu_template.render();
lsu_inst_1_list.map(x=>x.move(100,500));

Object.keys(sys.actors).map(x=>sys.actors[x].print_details());