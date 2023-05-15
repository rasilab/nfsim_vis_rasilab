import * as core from "./vis_core.js";

// core system initialization, async
let settings = new core.Settings("vis_settings.json");
await settings.parse_settings_file();
let sys = settings.system;

// keep track of what we are currently showing
let current_molecule_render;
let current_molecule_inst;
let current_component_render;

// add dropdown functionality
var x = document.getElementById("molec_dropdown");
for (let i = 0; i < Object.keys(sys.actor_definitions).length; i++) {
  let defn = sys.actor_definitions[Object.keys(sys.actor_definitions)[i]];
  var mol_el = document.createElement("button");
  mol_el.id = `${defn.name}`;
  mol_el.innerText = `${defn.name}`;
  mol_el.className = "contentbtn";

  // event listener for rendering molecule
  mol_el.addEventListener("click", () => {
    // remove previous buttons
    document.getElementById("compbuttons").innerHTML = "";
    if (current_molecule_render != null) {
      console.log(`removing previous molecule render`);
      current_molecule_render.remove();
    }
    console.log(`rendering: ${defn.name}`);
    // let's figure out what's going on here
    let inst = sys.add_actor_from_name(defn.name);
    // render
    for (let j = 0; j < Object.keys(inst.components).length; j++) {
      // set default state
      inst.components[Object.keys(inst.components)[j]].set_state_by_id(0);
    }
    // remove old molecule render
    if (current_molecule_render != null) {
      current_molecule_render.remove();
    }
    let inst_grp = inst.render();
    current_molecule_inst = inst;
    current_molecule_render = inst_grp;
    // moves relative to current location
    inst_grp.dmove(1000, 1000);
    // resizing, null allows for proportional resizing
    inst_grp.size(2000, null);

    // create component dropdown
    var comp_dropdown = document.createElement("select");
    comp_dropdown.id = "compdropdown";
    comp_dropdown.className = "compdropdown";

    // create and append options to the dropdown
    for (let j = 0; j < Object.keys(current_molecule_inst.components).length; j++) {
      let comp_key = Object.keys(current_molecule_inst.components)[j];
      let comp_option = document.createElement("option");
      comp_option.value = comp_key;
      comp_option.innerText = comp_key;
      comp_dropdown.appendChild(comp_option);
    }

    // dropdown functionality
    comp_dropdown.addEventListener("change", () => {
      // get selected component
      let selected_component = comp_dropdown.value;

      // remove old component render
      if (current_component_render != null) {
        current_component_render.remove();
      }

      // render the selected component
      current_component_render = current_molecule_inst.components[selected_component].render();
      current_component_render.dmove(1000, 1000);
      current_component_render.size(2000, null);

      // append the new render to the DOM
      document.getElementById("renderContainer").appendChild(current_component_render);
    });

    // append the component dropdown to the compbuttons container
    document.getElementById("compbuttons").appendChild(comp_dropdown);

    // append the new molecule render to the DOM
    document.getElementById("renderContainer").appendChild(inst_grp);
  });

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