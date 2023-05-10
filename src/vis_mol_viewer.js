import * as core from "./vis_core.js";

// core system initialization, async
let settings = new core.Settings("vis_settings.json");
await settings.parse_settings_file();
let sys = settings.system;

// keep track of what we are currently showing
let current_render;

// add dropdown functionality
var x = document.getElementById("molec_dropdown");
for (let i=0;i<Object.keys(sys.actor_definitions).length;i++) {
  let defn = sys.actor_definitions[Object.keys(sys.actor_definitions)[i]];
  var mol_el = document.createElement("button");
  mol_el.id = `${defn.name}`
  mol_el.innerText = `${defn.name}`;
  mol_el.className = "contentbtn";
  // event listener for rendering molecule
  mol_el.addEventListener("click", ()=>{
    if (current_render!=null) {
      console.log(`removing previous render`)
      current_render.remove();
    }
    console.log(`rendering: ${defn.name}`);
    // let's figure out what's going on here
    let inst = sys.add_actor_from_name(defn.name);
    inst.components["component1"].set_state_by_id(0);
    inst.components["component2"].set_state_by_id(0);
    let inst_grp = inst.render();
    current_render = inst_grp;
    // moves relative to current location
    inst_grp.dmove(1000, 1000);
    // resizing, null allows for proportional resizing
    inst_grp.size(2000, null);
  })
  x.appendChild(mol_el);
}

// on click function
function show_molecules() {
  document.getElementById("molec_dropdown").classList.toggle("show");
}

// get button to add click listener
var btn = document.getElementById("molec_button");
btn.addEventListener("click", show_molecules);

// close list when clicked outside
window.onclick = function(e) {
    if (!e.target.matches('.dropbtn')) {
    var myDropdown = document.getElementById("molec_dropdown");
      if (myDropdown.classList.contains('show')) {
        myDropdown.classList.remove('show');
      }
    }
  }

