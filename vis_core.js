// Begin: Actor classes
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
    render() {
        Error("Not implemented for template class");
    }
}

export class Molecule extends Actor {
    constructor (name, parent, components, symbol) {
        super(name, parent);
        this.components = components;
        this.symbol = symbol;
    }
    add_component (name,component) {
        component.set_system(this.system);
        this.components[name] = component;
    }
    render (trans_mat) {
        // render molecule
        let render_inst = this.system.canvas.use(this.symbol);
        this.system.add_instance(render_inst);
        let state_renders = [];
        // render components
        for (let i = 0;i<Object.keys(this.components).length;i++) {
            let state_render = this.components[Object.keys(this.components)[i]].render(trans_mat)
            this.system.add_instance(state_render);
            state_renders.push(state_render);
        }
        if (trans_mat != null) {
            console.log("transform matrix not implemented yet");
        }
        // TODO: figure out how to group the render
        return [render_inst].concat(state_renders);
    }
    // detail printing for debug purposes
    print_details () {
        console.log(`Molecule name: ${this.name}`);
        console.log(`Molecule rep: ${this.symbol}`);
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
        state.set_system(this.system);
        this.states.push(state);
        state.set_parent(this);
    }
    set_state (state) {
        this.current_state = state;
    }
    render (trans_mat) {
        // TODO: adjust trans mat for relative coordinates

        // render component states
        let render_inst = this.current_state.render(trans_mat);
        if (trans_mat != null) {
            console.log("transform matrix not implemented yet");
        }
        // TODO: figure out how to group the render
        return render_inst;
    }
    // detail printing for debug purposes
    print_details () {
        console.log(`  Component name: ${this.name}`);
        console.log(`  Component state: ${this.current_state.name}`);
        console.log(`  Component pos: ${this.pos}`);
        for (let i=0;i<Object.keys(this.states).length;i++) {
            this.states[Object.keys(this.states)[i]].print_details();
        }
    }
}

export class ComponentState extends Actor {
    constructor (name, parent, symbol) {
        super(name, parent);
        this.symbol = symbol;
    }
    set_symbol(symbol) {
        this.symbol = symbol;
    }
    render (trans_mat) {
        // render state
        let render_inst = this.system.canvas.use(this.symbol);
        // transform as needed
        if (trans_mat != null) {
            console.log("transform matrix not implemented yet");
        }
        return render_inst;
    }
    // detail printing for debug purposes
    print_details () {
        console.log(`    State name: ${this.name}`);
        console.log(`    State rep: ${this.symbol}`);
    }
}
// End: Actor classes

// Main system class
export class System {
    constructor (canvas, actors, svgs, timeline) {
        this.canvas = canvas;
        this.actors = actors;
        this.timeline = timeline;
        this.svgs = svgs;
        this.symbols = {};
        this.instances = [];
    }
    async initialize (mol_types) {
        // we need to load in the SVG strings first
        await this.load_svgs(mol_types);
        // we now make symbols from each for re-use
        await this.define_symbols();
        // adding actors and associate them with symbols
        await this.add_actors(mol_types);
    }
    add_instance (instance) {
        this.instances.push(instance);
    }
    add_actor (actor) {
        actor.set_system(this);
        this.actors[actor.name] = actor;
    }
    async add_actors (mol_types) {
        // initialize actors
        return mol_types.map(x=>this.make_actor_from_def(x))
                        .map(y=>this.add_actor(y));
    }
    // actor related methods
    make_actor_from_def (def) {
        let molecule = new Molecule(def['name'],this,{},this.symbols[def['svg_path']]);
        for (let i=0;i<def['components'].length;i++) {
            let component = new Component(def['components'][i]['name'],
                                    molecule, [], 0, def['components'][i]['pos']);
            component.set_system(this);
            for (let j=0;j<def['components'][i]["component_states"].length;j++) {
                let name = def['components'][i]["component_states"][j]['name'];
                let state = new ComponentState(name,component,
                                    this.symbols[`${def['components'][i]["component_states"][j]['svg_path']}`]);
                component.add_state(state);
            }
            component.set_state(component.states[def['components'][i]['current_state']]);
            molecule.add_component(component.name, component);
        }
        return molecule;
    }
    // svgs and related methods
    add_svg (name, svg) {
        this.svgs[name] = svg;
    }
    async load_svgs(molecule_types) {
        for (let i=0;i<molecule_types.length;i++) {
            let molec = molecule_types[i];
            await fetch(molec['svg_path'])
                    .then(resp=>resp.text())
                    .then(str=>this.add_svg(`${molec['svg_path']}`,str));
            for (let j=0;j<molec['components'].length;j++) {
                let comp = molec['components'][j];
                for (let k=0;k<comp["component_states"].length;k++) {
                    let state = comp["component_states"][k];
                    await fetch(state['svg_path'])
                        .then(resp=>resp.text())
                        .then(str=>this.add_svg(`${state['svg_path']}`,str));
                }
            }
        }
    }
    define_symbol(rep_name) {
        let s = this.canvas.symbol();
        let def = s.svg(this.svgs[rep_name]);
        this.symbols[rep_name] = def;
    }
    define_symbols() {
        return Promise.all(Object.keys(this.svgs).map(x=>this.define_symbol(x)));
    }
}

// Main settings class for parsing a setting file
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
        let sys = new System(canvas, {}, {}, timeline);
        // initialize
        await sys.initialize(vis_settings['molecule_types']);
        // return initialized system
        console.log("--System intialized--");
        this.system = sys;
    }
}