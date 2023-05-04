export class System {
    constructor (canvas, actors, representations, timeline) {
        this.canvas = canvas;
        this.actors = actors;
        this.timeline = timeline;
        this.representations = representations;
        this.definitions = {};
    }
    async initialize (mol_types) {
        // we need to load in the SVG strings first
        await this.load_representations(mol_types);
        // we now make symbols from each for re-use
        await this.define_representations();
        // adding actors and associate them with symbols
        await this.add_actors(mol_types);
    }
    async add_actors (mol_types) {
        // initialize actors
        return mol_types.map(x=>this.make_actor_from_def(x))
                        .map(y=>this.add_actor(y));
    }
    // actor related methods
    make_actor_from_def (def) {
        let molecule = new Molecule(def['name'],this,{},this.definitions[def['name']]);
        for (let i=0;i<def['components'].length;i++) {
            let component = new Component(def['components'][i]['name'],
                                    molecule, [], 0, def['components'][i]['pos']);
            for (let j=0;j<def['components'][i]["component_states"].length;j++) {
                let name = def['components'][i]["component_states"][j]['name'];
                let state = new ComponentState(name,component,
                                    this.definitions[`${molecule.name}_${component.name}_${name}`]);
                component.add_state(state);
            }
            molecule.add_component(component.name, component);
        }
        return molecule;
    }
    add_actor (actor) {
        actor.set_system(this);
        this.actors.push(actor);
    }
    // representations and related methods
    add_representation (name, representation) {
        this.representations[name] = representation;
    }
    async load_representations(molecule_types) {
        for (let i=0;i<molecule_types.length;i++) {
            let molec = molecule_types[i];
            await fetch(molec['svg_path'])
                    .then(resp=>resp.text())
                    .then(str=>this.add_representation(`${molec['name']}`,str));
            for (let j=0;j<molec['components'].length;j++) {
                let comp = molec['components'][j];
                for (let k=0;k<comp["component_states"].length;k++) {
                    let state = comp["component_states"][k];
                    await fetch(state['svg_path'])
                        .then(resp=>resp.text())
                        .then(str=>this.add_representation(`${molec['name']}_${comp['name']}_${state['name']}`,str));
                }
            }
        }
    }
    define_representation(rep_name) {
        let s = this.canvas.symbol();
        let def = s.svg(this.representations[rep_name]);
        this.definitions[rep_name] = def;
    }
    define_representations() {
        return Promise.all(Object.keys(this.representations).map(x=>this.define_representation(x)));
    }
}

export class Actor {
    constructor (name, parent) {
        this.name = name;
        this.parent = parent;
        this.system = null;
    }
    set_parent(parent) { 
        this.parent = parent;
    }
    set_system(system) {
        this.system = system;
    }
}

export class Molecule extends Actor {
    constructor (name, parent, components, definition) {
        super(name, parent);
        this.components = components;
        this.definition = definition;
    }
    add_component (name,component) {
        component.set_system(this.system);
        this.components[name] = component;
    }
    print_details () {
        console.log(`Molecule name: ${this.name}`);
        console.log(`Molecule rep: ${this.definition}`);
        for (let i=0;i<Object.keys(this.components).length;i++) {
            this.components[Object.keys(this.components)[i]].print_details();
        }
    }
}

export class Component extends Actor {
    constructor (name, parent, states, current_state, pos) {
        super(name, parent);
        this.states = states;
        this.current_state = current_state;
        this.pos = pos;
    }
    add_state (state) {
        this.states.push(state);
        state.set_parent(this);
    }
    set_state (state) {
        this.current_state = state;
    }
    print_details () {
        console.log(`  Component name: ${this.name}`);
        console.log(`  Component state: ${this.current_state}`);
        console.log(`  Component pos: ${this.pos}`);
        for (let i=0;i<Object.keys(this.states).length;i++) {
            this.states[Object.keys(this.states)[i]].print_details();
        }
    }
}

export class ComponentState extends Actor {
    constructor (name, parent, definition) {
        super(name, parent);
        this.definition = definition;
    }
    set_representation(definition) {
        this.definition = definition;
    }
    print_details () {
        console.log(`    State name: ${this.name}`);
        console.log(`    State rep: ${this.definition}`);
    }
}

export class Settings {
    constructor (setting_file) {
        this.setting_file = setting_file;
        this.system = null;
    }
    async parse_settings_file() {
        // fetch settings JSON
        let settings_json = await fetch(this.setting_file).then(setting=>setting.json());
        // initialize system from settings
        let vis_settings = settings_json['visualization_settings'];
        let w=vis_settings['general']['width'],h=vis_settings['general']['height'];
        let timeline = new SVG.Timeline();
        let canvas = SVG().addTo('body').size(window.innerWidth, window.innerHeight).viewbox(0, 0, w, h);
        let sys = new System(canvas, [], {}, timeline);
        // initialize
        await sys.initialize(vis_settings['molecule_types']);
        // return initialized system
        console.log("--System intialized--");
        this.system = sys;
    }
}